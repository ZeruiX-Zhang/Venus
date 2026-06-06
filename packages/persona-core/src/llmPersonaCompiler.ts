import type { ModelClient } from "@personal-character-agent/agent-core";
import {
  createDefaultSoulCard,
  type SoulCard
} from "@personal-character-agent/shared";
import type {
  CharacterCandidate,
  NovelPersonaInput,
  OriginalCharacterInput,
  PersonaCompiler
} from "./types";
import { MockPersonaCompiler } from "./mockPersonaCompiler";

export interface LLMPersonaCompilerOptions {
  modelClient?: ModelClient;
  enabled: boolean;
  chunkSize?: number;
}

const CHUNK_SIZE_DEFAULT = 4000;

const EXTRACT_SYSTEM_PROMPT = `You are a character extraction engine. Analyze the text and identify characters.

For each character found, output JSON:
[{
  "name": "character name",
  "aliases": ["other names"],
  "evidence": ["quote 1", "quote 2"],
  "confidence": 0.0-1.0,
  "inferredTraits": ["trait1", "trait2"]
}]

Rules:
- Only include characters who appear with meaningful actions or dialogue
- confidence: >0.8 for main characters, 0.5-0.8 for supporting, <0.5 for mentioned-only
- inferredTraits: personality traits inferred from behavior and dialogue
- Return strict JSON array, no markdown wrapping`;

const MERGE_SYSTEM_PROMPT = `You are merging character extraction results from multiple text chunks into a unified list.

Input: multiple JSON arrays of character candidates from different chunks of the same novel.
Task: merge duplicates (same character appearing in multiple chunks), combine their evidence, update confidence, and unify traits.

Output: a single JSON array with the same format:
[{"name":"...","aliases":[],"evidence":["..."],"confidence":0.0-1.0,"inferredTraits":["..."]}]

Rules:
- Keep at most 3 evidence quotes per character (pick the most revealing ones)
- Confidence should reflect total presence across all chunks
- Deduplicate traits
- Return strict JSON array, no markdown`;

const SOULCARD_SYSTEM_PROMPT = `You are a character profile generator for an AI companion system. Given evidence about a character from a novel, generate a detailed character profile as JSON.

Output format (strict JSON):
{
  "tone": "speech tone description",
  "formality": "casual" | "polite" | "formal",
  "verbosity": "short" | "balanced" | "expressive",
  "firstPerson": "how they refer to themselves",
  "catchphrases": ["phrase1"],
  "personality_description": "2-3 sentence personality summary",
  "personality_tags": ["tag1", "tag2"],
  "traits": {
    "openness": 0.0-1.0,
    "kindness": 0.0-1.0,
    "assertiveness": 0.0-1.0,
    "curiosity": 0.0-1.0,
    "humor": 0.0-1.0,
    "energy": 0.0-1.0
  },
  "behavior_rules": ["rule1", "rule2"],
  "relationship_notes": "how this character would relate to users"
}

Infer everything from the evidence. Stay faithful to the source material.`;

function parseJsonArray(text: string): unknown[] {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  const match = /\[[\s\S]*\]/.exec(cleaned);
  if (!match) return [];
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  const match = /\{[\s\S]*\}/.exec(cleaned);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// 把长文本切成指定大小的 chunk（按句子边界切割，避免截断）
function chunkText(text: string, chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // 在 chunk 边界处找最近的句子结尾
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastSentenceEnd = Math.max(
        slice.lastIndexOf("。"),
        slice.lastIndexOf("."),
        slice.lastIndexOf("！"),
        slice.lastIndexOf("？"),
        slice.lastIndexOf("\n")
      );
      if (lastSentenceEnd > chunkSize * 0.5) {
        end = start + lastSentenceEnd + 1;
      }
    }

    chunks.push(text.slice(start, end));
    start = end;
  }

  return chunks;
}

function isValidCandidate(item: unknown): item is CharacterCandidate {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    obj.name.length > 0 &&
    typeof obj.confidence === "number" &&
    Array.isArray(obj.evidence) &&
    Array.isArray(obj.inferredTraits)
  );
}

function toCandidateWithId(raw: CharacterCandidate): CharacterCandidate {
  return {
    ...raw,
    id: raw.id ?? `candidate_${raw.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    aliases: raw.aliases ?? [],
    evidence: (raw.evidence ?? []).map(String),
    inferredTraits: (raw.inferredTraits ?? []).map(String)
  };
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export class LLMPersonaCompiler implements PersonaCompiler {
  private readonly fallback = new MockPersonaCompiler();
  private readonly chunkSize: number;

  constructor(private readonly options: LLMPersonaCompilerOptions) {
    this.chunkSize = options.chunkSize ?? CHUNK_SIZE_DEFAULT;
  }

  async extractCharactersFromNovel(input: string): Promise<CharacterCandidate[]> {
    const modelClient = this.getModelClient();
    const chunks = chunkText(input, this.chunkSize);

    // 逐段提取角色
    const chunkResults: CharacterCandidate[][] = [];
    for (const chunk of chunks) {
      try {
        const response = await modelClient.generateText({
          messages: [
            { role: "system", content: EXTRACT_SYSTEM_PROMPT },
            { role: "user", content: chunk }
          ],
          temperature: 0.3
        });
        const raw = parseJsonArray(response.text);
        const valid = raw.filter(isValidCandidate).map(toCandidateWithId);
        chunkResults.push(valid);
      } catch {
        // 单个 chunk 失败不影响整体
      }
    }

    // 单 chunk 直接返回
    if (chunkResults.length <= 1) {
      const result = chunkResults[0] ?? [];
      return result.length > 0 ? result : this.fallback.extractCharactersFromNovel(input);
    }

    // 多 chunk 需要合并
    try {
      const mergeInput = chunkResults.map((r, i) => `Chunk ${i + 1}:\n${JSON.stringify(r)}`).join("\n\n");
      const mergeResponse = await modelClient.generateText({
        messages: [
          { role: "system", content: MERGE_SYSTEM_PROMPT },
          { role: "user", content: mergeInput }
        ],
        temperature: 0.2
      });
      const merged = parseJsonArray(mergeResponse.text)
        .filter(isValidCandidate)
        .map(toCandidateWithId);
      if (merged.length > 0) return merged;
    } catch {
      // 合并失败，手动去重
    }

    // fallback: 手动合并各 chunk 结果
    return this.manualMerge(chunkResults);
  }

  async generateSoulCardFromCharacter(input: NovelPersonaInput): Promise<SoulCard> {
    const modelClient = this.getModelClient();

    const evidenceText = input.candidate.evidence.join("\n");
    const userNotes = input.userNotes ? `\nUser notes: ${input.userNotes}` : "";

    try {
      const response = await modelClient.generateText({
        messages: [
          { role: "system", content: SOULCARD_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Character: ${input.candidate.name}\nTraits: ${input.candidate.inferredTraits.join(", ")}\nEvidence:\n${evidenceText}${userNotes}`
          }
        ],
        temperature: 0.5
      });

      const profile = parseJsonObject(response.text);
      if (profile) {
        return this.buildSoulCardFromProfile(input, profile);
      }
    } catch {
      // LLM 失败，走 fallback
    }

    return this.fallback.generateSoulCardFromCharacter(input);
  }

  async generateOriginalSoulCard(input: OriginalCharacterInput): Promise<SoulCard> {
    const modelClient = this.getModelClient();

    try {
      const response = await modelClient.generateText({
        messages: [
          { role: "system", content: SOULCARD_SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(input) }
        ],
        temperature: 0.5
      });

      const profile = parseJsonObject(response.text);
      if (profile) {
        const card = createDefaultSoulCard(input.name);
        return this.applySoulCardProfile(card, profile, "original_character");
      }
    } catch {
      // LLM 失败，走 fallback
    }

    const card = createDefaultSoulCard(input.name);
    return {
      ...card,
      personality: {
        ...card.personality,
        description: input.description
      }
    };
  }

  validateSoulCard = this.fallback.validateSoulCard.bind(this.fallback);

  private getModelClient(): ModelClient {
    if (!this.options.enabled || !this.options.modelClient) {
      throw new Error(
        "LLMPersonaCompiler is disabled. Configure a ModelClient before enabling it."
      );
    }
    return this.options.modelClient;
  }

  // 从 LLM 返回的 profile JSON 构建完整 SoulCard
  private buildSoulCardFromProfile(
    input: NovelPersonaInput,
    profile: Record<string, unknown>
  ): SoulCard {
    const card = createDefaultSoulCard(input.candidate.name);
    const timestamp = new Date().toISOString();
    const traits = (profile.traits ?? {}) as Record<string, unknown>;

    return {
      ...card,
      origin_mode: "novel_import",
      speech_style: {
        ...card.speech_style,
        tone: String(profile.tone ?? card.speech_style.tone),
        formality: this.pickFormality(profile.formality),
        verbosity: this.pickVerbosity(profile.verbosity),
        firstPerson: profile.firstPerson ? String(profile.firstPerson) : card.speech_style.firstPerson,
        catchphrases: Array.isArray(profile.catchphrases)
          ? profile.catchphrases.map(String)
          : card.speech_style.catchphrases
      },
      personality: {
        openness: clamp01(Number(traits.openness) || card.personality.openness),
        kindness: clamp01(Number(traits.kindness) || card.personality.kindness),
        assertiveness: clamp01(Number(traits.assertiveness) || card.personality.assertiveness),
        curiosity: clamp01(Number(traits.curiosity) || card.personality.curiosity),
        humor: clamp01(Number(traits.humor) || card.personality.humor),
        energy: clamp01(Number(traits.energy) || card.personality.energy),
        tags: Array.isArray(profile.personality_tags)
          ? [...new Set([...profile.personality_tags.map(String), ...input.candidate.inferredTraits])]
          : [...new Set([...card.personality.tags, ...input.candidate.inferredTraits])],
        description: profile.personality_description
          ? String(profile.personality_description)
          : card.personality.description
      },
      behavior: Array.isArray(profile.behavior_rules)
        ? profile.behavior_rules.map(String)
        : card.behavior,
      relationship_to_user: {
        ...card.relationship_to_user,
        role: "companion",
        notes: profile.relationship_notes
          ? String(profile.relationship_notes)
          : "Imported from novel text."
      },
      knowledge: [
        {
          id: `knowledge_${input.candidate.id}`,
          type: "novel_excerpt",
          title: `Novel evidence for ${input.candidate.name}`,
          content: [input.candidate.evidence.join("\n"), input.userNotes].filter(Boolean).join("\n---\n"),
          trustLevel: input.candidate.confidence,
          createdAt: timestamp
        }
      ],
      updatedAt: timestamp
    };
  }

  // 把 LLM profile 应用到已有的 SoulCard 上
  private applySoulCardProfile(
    card: SoulCard,
    profile: Record<string, unknown>,
    originMode: SoulCard["origin_mode"]
  ): SoulCard {
    const traits = (profile.traits ?? {}) as Record<string, unknown>;
    return {
      ...card,
      origin_mode: originMode,
      speech_style: {
        ...card.speech_style,
        tone: String(profile.tone ?? card.speech_style.tone),
        formality: this.pickFormality(profile.formality),
        verbosity: this.pickVerbosity(profile.verbosity),
        firstPerson: profile.firstPerson ? String(profile.firstPerson) : card.speech_style.firstPerson,
        catchphrases: Array.isArray(profile.catchphrases)
          ? profile.catchphrases.map(String)
          : card.speech_style.catchphrases
      },
      personality: {
        ...card.personality,
        openness: clamp01(Number(traits.openness) || card.personality.openness),
        kindness: clamp01(Number(traits.kindness) || card.personality.kindness),
        assertiveness: clamp01(Number(traits.assertiveness) || card.personality.assertiveness),
        curiosity: clamp01(Number(traits.curiosity) || card.personality.curiosity),
        humor: clamp01(Number(traits.humor) || card.personality.humor),
        energy: clamp01(Number(traits.energy) || card.personality.energy),
        tags: Array.isArray(profile.personality_tags)
          ? profile.personality_tags.map(String)
          : card.personality.tags,
        description: profile.personality_description
          ? String(profile.personality_description)
          : card.personality.description
      },
      behavior: Array.isArray(profile.behavior_rules)
        ? profile.behavior_rules.map(String)
        : card.behavior
    };
  }

  // 多 chunk 结果手动合并（LLM 合并失败时的 fallback）
  private manualMerge(chunkResults: CharacterCandidate[][]): CharacterCandidate[] {
    const byName = new Map<string, CharacterCandidate>();

    for (const chunk of chunkResults) {
      for (const candidate of chunk) {
        const key = candidate.name.toLowerCase();
        const existing = byName.get(key);
        if (existing) {
          const allEvidence = [...existing.evidence, ...candidate.evidence];
          existing.evidence = allEvidence.slice(0, 3);
          existing.confidence = clamp01(Math.max(existing.confidence, candidate.confidence) + 0.05);
          existing.inferredTraits = [...new Set([...existing.inferredTraits, ...candidate.inferredTraits])];
        } else {
          byName.set(key, { ...candidate });
        }
      }
    }

    return [...byName.values()]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  }

  private pickFormality(val: unknown): "casual" | "polite" | "formal" {
    if (val === "casual" || val === "polite" || val === "formal") return val;
    return "casual";
  }

  private pickVerbosity(val: unknown): "short" | "balanced" | "expressive" {
    if (val === "short" || val === "balanced" || val === "expressive") return val;
    return "balanced";
  }
}
