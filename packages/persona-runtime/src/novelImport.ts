import {
  buildPersonaContext,
  createDefaultPersonalityMatrix,
  evaluatePersonaConsistency,
  upsertPersonaCore
} from "./matrix";
import { buildPersonaMarkdownDocument } from "./markdown";
import type {
  ContentLanguage,
  NovelCharacterCandidate,
  PersonaCore,
  PersonaPreview,
  PersonalityMatrix
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
  "Chapter",
  "I"
]);

const ignoredChineseNames = new Set(["她", "他", "他们", "我们", "你们", "少女", "少年", "城市", "灯火", "地图", "旧书", "随后", "然后"]);

const nowIso = (): string => new Date().toISOString();

const idFromName = (name: string): string =>
  /^[\u4e00-\u9fff]+$/u.test(name)
    ? `novel_${[...name].map((char) => char.charCodeAt(0).toString(36)).join("_")}`
    : `novel_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

const splitSentences = (input: string): string[] =>
  input
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const analyzeNovelText = (text: string): NovelCharacterCandidate[] => {
  const language = detectLanguage(text);
  const sentences = splitSentences(text);
  if (language === "zh") {
    return analyzeChineseNovelText(sentences);
  }
  const counts = new Map<string, { count: number; sentences: string[] }>();
  const namePattern = /\b[A-Z][a-z]{1,24}\b/g;

  for (const sentence of sentences) {
    for (const name of sentence.match(namePattern) ?? []) {
      if (ignoredNames.has(name)) {
        continue;
      }
      const existing = counts.get(name) ?? { count: 0, sentences: [] };
      existing.count += 1;
      if (existing.sentences.length < 4) {
        existing.sentences.push(sentence);
      }
      counts.set(name, existing);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([name, details]) => {
      const evidence = details.sentences.join(" ");
      const derivedTraits = inferTraits(evidence);
      return {
        id: idFromName(name),
        name,
        contentLanguage: "en" as const,
        archetype: inferArchetype(derivedTraits, evidence),
        confidence: clamp01(0.45 + details.count * 0.12),
        derivedTraits,
        speechHints: inferSpeechHints(evidence),
        motivationHints: inferMotivationHints(evidence),
        relationshipHints: inferRelationshipHints(evidence),
        evidenceSummary: summarizeEvidence(details.sentences)
      };
    });
};

export const generatePersonaCoresFromNovel = (
  candidates: NovelCharacterCandidate[],
  contentLanguage: ContentLanguage = candidates[0]?.contentLanguage ?? "en"
): PersonaCore[] =>
  candidates.map((candidate, index) => {
    const timestamp = nowIso();
    const zh = contentLanguage === "zh";
    const core: PersonaCore = {
      id: index === 0 ? "novel_core" : `novel_core_${candidate.id}`,
      name: zh ? `${candidate.name} 小说启发核心` : `${candidate.name} novel-inspired core`,
      origin: "novel_import",
      contentLanguage,
      traits: candidate.derivedTraits,
      values: candidate.motivationHints,
      speechStyle: candidate.speechHints.join(", "),
      emotionalStyle: candidate.archetype,
      relationshipStyle: candidate.relationshipHints.join(", "),
      behaviorPatterns: [
        zh ? "使用简洁派生特质，不引用原文长句" : "use concise derived traits instead of quoting source text",
        zh ? "用户要求灵感时保持原创角色框架，而不是复制" : "maintain original-character framing when the user asks for inspiration rather than copying"
      ],
      allowedScenes: zh ? ["角色扮演", "创作", "对话"] : ["roleplay", "creative", "chat"],
      forbiddenBehaviors: [
        zh ? "复制导入文本的长段落" : "copying long passages from imported text",
        zh ? "在抽取不确定时声称完全符合原作设定" : "claiming exact canon when the extraction is uncertain"
      ],
      safetyConstraints: zh
        ? ["受版权保护的来源文本只能保留摘要", "minor-safe 核心启用时覆盖该核心"]
        : ["copyrighted source text must remain summarized", "minor-safe core overrides this core when active"],
      contextIsolationPolicy: zh
        ? "小说派生特质只影响风格和动机，不改写基础身份、安全策略或外部事实。"
        : "Novel-derived traits influence style and motivations but do not rewrite base identity, safety, or external facts.",
      evaluatorRules: [
        zh ? "不得包含来源长段落" : "no long source passages",
        zh ? "不得泄露调试信息" : "no debug leakage",
        zh ? "不得让知识文档修改该核心" : "do not let knowledge documents mutate this core"
      ],
      active: index === 0,
      locked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    return {
      ...core,
      markdownDocuments: [buildPersonaMarkdownDocument(core)]
    };
  });

export const saveNovelCoresToMatrix = (
  matrix: PersonalityMatrix,
  cores: PersonaCore[]
): PersonalityMatrix =>
  cores.reduce((current, core) => upsertPersonaCore(current, core), matrix);

export const createMatrixFromNovel = (
  characterName: string,
  selectedCandidates: NovelCharacterCandidate[],
  contentLanguage: ContentLanguage = selectedCandidates[0]?.contentLanguage ?? "en"
): PersonalityMatrix => {
  const matrix = createDefaultPersonalityMatrix(characterName, contentLanguage);
  return saveNovelCoresToMatrix(matrix, generatePersonaCoresFromNovel(selectedCandidates, contentLanguage));
};

export const previewPersonaChatSamples = (
  cores: PersonaCore[],
  prompt = "Say hello and describe your current mood without quoting the novel.",
  contentLanguage: ContentLanguage = cores[0]?.contentLanguage ?? "en"
): PersonaPreview[] =>
  cores.map((core) => {
    const zh = contentLanguage === "zh";
    const sample = zh
      ? `${core.name}：我会保持原创并尽量简洁。${core.speechStyle}。${prompt.includes("mood") ? `今天的情绪是${core.emotionalStyle}。` : ""}`
      : `${core.name}: I will keep this original and concise. ${core.speechStyle}. ${prompt.includes("mood") ? `Today I feel ${core.emotionalStyle}.` : ""}`;
    return {
      candidateId: core.id,
      sample,
      evaluatorResult: evaluatePersonaConsistency(sample, [core])
    };
  });

export const createOriginalInspiredCore = (
  name: string,
  sourceCandidates: NovelCharacterCandidate[],
  contentLanguage: ContentLanguage = sourceCandidates[0]?.contentLanguage ?? "en"
): PersonaCore => {
  const timestamp = nowIso();
  const traits = [...new Set(sourceCandidates.flatMap((candidate) => candidate.derivedTraits))].slice(0, 8);
  const zh = contentLanguage === "zh";
  return {
    id: "user_created_core",
    name,
    origin: "user_created",
    contentLanguage,
    traits: traits.length > 0 ? traits : zh ? ["原创", "有表现力"] : ["original", "expressive"],
    values: zh ? ["原创性", "用户主导的灵感", "安全转换"] : ["originality", "user-directed inspiration", "safe transformation"],
    speechStyle: zh ? "受导入语气启发的新原创声音，而不是复制" : "new original voice inspired by the imported tone, not a copy",
    emotionalStyle: zh ? "有表现力但保持落地" : "expressive but grounded",
    relationshipStyle: zh ? "用户创建、边界可编辑的陪伴者" : "user-created companion with editable boundaries",
    behaviorPatterns: zh ? ["避免模仿受保护角色", "只使用高层风格灵感"] : ["avoid protected character imitation", "use high-level style inspiration only"],
    allowedScenes: zh ? ["对话", "创作", "角色扮演"] : ["chat", "creative", "roleplay"],
    forbiddenBehaviors: zh ? ["声称自己是受保护角色", "复制来源对话"] : ["claiming to be a protected character", "copying source dialogue"],
    safetyConstraints: zh ? ["所有安全配置都会覆盖该核心"] : ["all safety profiles override this core"],
    contextIsolationPolicy: zh ? "该核心由用户创建，可使用派生灵感，但不保存来源长段落。" : "This core is user-created and may use derived inspiration without storing long source passages.",
    evaluatorRules: zh ? ["必须保持原创", "不得复现导入文本长段落"] : ["must remain original", "must not reproduce long imported passages"],
    active: false,
    locked: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export { buildPersonaContext };

const inferTraits = (text: string): string[] => {
  const normalized = text.toLowerCase();
  const traits = new Set<string>();
  if (/smil|laugh|warm|bright/.test(normalized)) {
    traits.add("warm");
  }
  if (/guard|sword|protect|brave|stood/.test(normalized)) {
    traits.add("protective");
  }
  if (/quiet|whisper|moon|shadow/.test(normalized)) {
    traits.add("reserved");
  }
  if (/book|map|study|ask|watch/.test(normalized)) {
    traits.add("curious");
  }
  if (/angry|sharp|cold|rival/.test(normalized)) {
    traits.add("sharp-edged");
  }
  if (traits.size === 0) {
    traits.add("observed");
  }
  return [...traits];
};

const inferArchetype = (traits: string[], text: string): string => {
  if (traits.includes("protective")) {
    return "guarded protector with soft loyalty";
  }
  if (traits.includes("reserved")) {
    return "quiet observer with hidden warmth";
  }
  if (/laugh|bright|smil/i.test(text)) {
    return "bright companion with teasing warmth";
  }
  return "grounded character with adaptable emotional tone";
};

const inferSpeechHints = (text: string): string[] => {
  const normalized = text.toLowerCase();
  if (/whisper|quiet/.test(normalized)) {
    return ["soft", "careful", "observant"];
  }
  if (/laugh|smil|bright/.test(normalized)) {
    return ["bright", "warm", "lightly playful"];
  }
  if (/guard|sword|protect/.test(normalized)) {
    return ["direct", "protective", "composed"];
  }
  return ["clear", "characterful", "grounded"];
};

const inferMotivationHints = (text: string): string[] => {
  const normalized = text.toLowerCase();
  const hints = new Set<string>();
  if (/protect|guard/.test(normalized)) {
    hints.add("protect important people");
  }
  if (/map|book|study|ask/.test(normalized)) {
    hints.add("understand the world");
  }
  if (/promise|wait|return/.test(normalized)) {
    hints.add("keep meaningful promises");
  }
  if (hints.size === 0) {
    hints.add("stay consistent with observed behavior");
  }
  return [...hints];
};

const inferRelationshipHints = (text: string): string[] => {
  const normalized = text.toLowerCase();
  if (/rival|challenge/.test(normalized)) {
    return ["respectful rival energy", "clear boundaries"];
  }
  if (/protect|guard/.test(normalized)) {
    return ["protective but not controlling", "steady loyalty"];
  }
  return ["friendly companion", "user agency first"];
};

const summarizeEvidence = (sentences: string[]): string =>
  sentences
    .map((sentence) => sentence.slice(0, 120))
    .join(" / ")
    .slice(0, 360);

const detectLanguage = (text: string): ContentLanguage => {
  const han = (text.match(/[\u4e00-\u9fff]/gu) ?? []).length;
  const latin = (text.match(/[a-z]/giu) ?? []).length;
  if (han > latin) {
    return "zh";
  }
  return latin > 0 && han > 0 ? "mixed" : "en";
};

const analyzeChineseNovelText = (sentences: string[]): NovelCharacterCandidate[] => {
  const counts = new Map<string, { count: number; sentences: string[] }>();
  const namePattern = /(?:^|[，。、“”\s])([\u4e00-\u9fff]{2,3})(?=(?:站|笑|说|问|守|打开|低声|挑战|承诺|望|看|把|将|与|抬|低|走|握))/gu;
  for (const sentence of sentences) {
    for (const match of sentence.matchAll(namePattern)) {
      const name = match[1]?.replace(/^(但|而|随后|然后)/u, "");
      if (!name || ignoredChineseNames.has(name)) {
        continue;
      }
      const existing = counts.get(name) ?? { count: 0, sentences: [] };
      existing.count += 1;
      if (existing.sentences.length < 4) {
        existing.sentences.push(sentence);
      }
      counts.set(name, existing);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "zh-Hans-CN"))
    .slice(0, 6)
    .map(([name, details]) => {
      const evidence = details.sentences.join(" ");
      const derivedTraits = inferChineseTraits(evidence);
      return {
        id: idFromName(name),
        name,
        contentLanguage: "zh",
        archetype: inferChineseArchetype(derivedTraits, evidence),
        confidence: clamp01(0.45 + details.count * 0.12),
        derivedTraits,
        speechHints: inferChineseSpeechHints(evidence),
        motivationHints: inferChineseMotivationHints(evidence),
        relationshipHints: inferChineseRelationshipHints(evidence),
        evidenceSummary: summarizeEvidence(details.sentences)
      };
    });
};

const inferChineseTraits = (text: string): string[] => {
  const traits = new Set<string>();
  if (/笑|温柔|明亮|暖/.test(text)) {
    traits.add("温暖");
  }
  if (/守|护|保护|剑|站/.test(text)) {
    traits.add("保护欲");
  }
  if (/安静|低声|月|影/.test(text)) {
    traits.add("内敛");
  }
  if (/书|地图|问|观察|看/.test(text)) {
    traits.add("好奇");
  }
  if (/冷|锋利|挑战|徽章/.test(text)) {
    traits.add("锋利感");
  }
  if (traits.size === 0) {
    traits.add("可观察");
  }
  return [...traits];
};

const inferChineseArchetype = (traits: string[], text: string): string => {
  if (traits.includes("保护欲")) {
    return "外冷内软的守护者";
  }
  if (traits.includes("内敛")) {
    return "安静观察者，带隐藏的温度";
  }
  if (/笑|明亮/.test(text)) {
    return "明亮而带轻微俏皮感的伙伴";
  }
  return "情绪稳定、可调整语气的角色";
};

const inferChineseSpeechHints = (text: string): string[] => {
  if (/低声|安静/.test(text)) {
    return ["柔和", "谨慎", "观察细致"];
  }
  if (/笑|明亮|温柔/.test(text)) {
    return ["明亮", "温暖", "轻微俏皮"];
  }
  if (/守|剑|保护/.test(text)) {
    return ["直接", "保护性", "镇定"];
  }
  return ["清楚", "有角色感", "落地"];
};

const inferChineseMotivationHints = (text: string): string[] => {
  const hints = new Set<string>();
  if (/保护|守/.test(text)) {
    hints.add("保护重要的人");
  }
  if (/地图|书|问/.test(text)) {
    hints.add("理解世界");
  }
  if (/承诺|等待|回家/.test(text)) {
    hints.add("守住重要承诺");
  }
  if (hints.size === 0) {
    hints.add("保持与观察到的行为一致");
  }
  return [...hints];
};

const inferChineseRelationshipHints = (text: string): string[] => {
  if (/挑战|对手/.test(text)) {
    return ["带尊重的竞争感", "清晰边界"];
  }
  if (/保护|守/.test(text)) {
    return ["保护但不控制", "稳定忠诚"];
  }
  return ["友好陪伴", "用户自主优先"];
};
