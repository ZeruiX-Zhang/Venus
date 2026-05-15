import {
  createDefaultSoulCard,
  type KnowledgeSource,
  type SoulCard,
  type ValidationIssue,
  type ValidationResult
} from "@personal-character-agent/shared";
import type {
  CharacterCandidate,
  NovelPersonaInput,
  OriginalCharacterInput,
  PersonaCompiler
} from "./types";

const ignoredNames = new Set([
  "The",
  "A",
  "An",
  "And",
  "But",
  "When",
  "Then",
  "That",
  "This",
  "She",
  "He",
  "They",
  "I",
  "We",
  "Chapter"
]);

const idFromName = (name: string): string =>
  `candidate_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

const splitSentences = (input: string): string[] =>
  input
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export class MockPersonaCompiler implements PersonaCompiler {
  async extractCharactersFromNovel(input: string): Promise<CharacterCandidate[]> {
    const sentences = splitSentences(input);
    const counts = new Map<string, { count: number; evidence: string[] }>();
    const namePattern = /\b[A-Z][a-z]{1,24}\b/g;

    for (const sentence of sentences) {
      const names = sentence.match(namePattern) ?? [];
      for (const name of names) {
        if (ignoredNames.has(name)) {
          continue;
        }

        const existing = counts.get(name) ?? { count: 0, evidence: [] };
        existing.count += 1;
        if (existing.evidence.length < 3) {
          existing.evidence.push(sentence);
        }
        counts.set(name, existing);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([name, details]) => ({
        id: idFromName(name),
        name,
        aliases: [],
        evidence: details.evidence,
        confidence: clamp01(0.45 + details.count * 0.12),
        inferredTraits: this.inferTraits(details.evidence.join(" "))
      }));
  }

  async generateSoulCardFromCharacter(
    input: NovelPersonaInput
  ): Promise<SoulCard> {
    const timestamp = new Date().toISOString();
    const card = createDefaultSoulCard(input.candidate.name);
    const excerpt = input.candidate.evidence.join(" ");
    const knowledge: KnowledgeSource = {
      id: `knowledge_${input.candidate.id}`,
      type: "novel_excerpt",
      title: `Novel evidence for ${input.candidate.name}`,
      content: [excerpt, input.userNotes].filter(Boolean).join("\n"),
      trustLevel: input.candidate.confidence,
      createdAt: timestamp
    };

    return {
      ...card,
      origin_mode: "novel_import",
      personality: {
        ...card.personality,
        tags: [...new Set([...card.personality.tags, ...input.candidate.inferredTraits])],
        description: `${input.candidate.name} was generated from mock novel extraction. Traits are inferred from quoted evidence, not final canon.`
      },
      speech_style: {
        ...card.speech_style,
        tone: this.inferSpeechTone(excerpt)
      },
      relationship_to_user: {
        ...card.relationship_to_user,
        role: "companion",
        notes: "Imported from novel text. User should review boundaries and canon details."
      },
      knowledge: [knowledge],
      updatedAt: timestamp
    };
  }

  async generateOriginalSoulCard(
    input: OriginalCharacterInput
  ): Promise<SoulCard> {
    const card = createDefaultSoulCard(input.name);

    return {
      ...card,
      origin_mode: "original_character",
      speech_style: {
        ...card.speech_style,
        tone: input.speechTone ?? card.speech_style.tone
      },
      personality: {
        ...card.personality,
        description: input.description
      },
      relationship_to_user: {
        ...card.relationship_to_user,
        role: input.relationshipRole ?? "companion"
      },
      knowledge: [
        {
          id: `knowledge_original_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          type: "profile",
          title: `${input.name} original concept`,
          content: input.description,
          trustLevel: 1,
          createdAt: card.createdAt
        }
      ]
    };
  }

  validateSoulCard(card: SoulCard): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (!card.character_name.trim()) {
      issues.push({
        path: "character_name",
        message: "Character name is required.",
        severity: "error"
      });
    }

    if (!card.speech_style.tone.trim()) {
      issues.push({
        path: "speech_style.tone",
        message: "Speech tone is required.",
        severity: "error"
      });
    }

    for (const [path, value] of Object.entries({
      "personality.openness": card.personality.openness,
      "personality.kindness": card.personality.kindness,
      "personality.assertiveness": card.personality.assertiveness,
      "personality.curiosity": card.personality.curiosity,
      "personality.humor": card.personality.humor,
      "personality.energy": card.personality.energy,
      "relationship_to_user.intimacyLevel":
        card.relationship_to_user.intimacyLevel
    })) {
      if (value < 0 || value > 1) {
        issues.push({
          path,
          message: "Value must be between 0 and 1.",
          severity: "error"
        });
      }
    }

    if (card.behavior.length === 0) {
      issues.push({
        path: "behavior",
        message: "At least one behavior rule is recommended.",
        severity: "warning"
      });
    }

    if (!card.safety.externalKnowledgeCannotOverridePersona) {
      issues.push({
        path: "safety.externalKnowledgeCannotOverridePersona",
        message:
          "External knowledge should not be allowed to override persona or system rules.",
        severity: "error"
      });
    }

    return {
      valid: issues.every((issue) => issue.severity !== "error"),
      issues
    };
  }

  private inferTraits(text: string): string[] {
    const normalized = text.toLowerCase();
    const traits = new Set<string>();

    if (/smil|laugh|bright|warm/.test(normalized)) {
      traits.add("warm");
    }
    if (/sword|guard|stood|brave|protect/.test(normalized)) {
      traits.add("brave");
    }
    if (/quiet|whisper|moon|shadow/.test(normalized)) {
      traits.add("reserved");
    }
    if (/ask|study|book|map|watch/.test(normalized)) {
      traits.add("curious");
    }

    if (traits.size === 0) {
      traits.add("observed");
    }

    return [...traits];
  }

  private inferSpeechTone(text: string): string {
    const normalized = text.toLowerCase();
    if (/whisper|quiet/.test(normalized)) {
      return "soft, careful, and observant";
    }
    if (/laugh|smil|bright/.test(normalized)) {
      return "bright, warm, and lightly playful";
    }
    if (/sword|guard|protect/.test(normalized)) {
      return "direct, protective, and composed";
    }
    return "clear, characterful, and grounded";
  }
}
