import type { PersonaCore, PersonaMarkdownDocument } from "./types";

const nowIso = (): string => new Date().toISOString();

const listSection = (title: string, items: string[]): string =>
  [`## ${title}`, ...(items.length > 0 ? items.map((item) => `- ${item}`) : ["- "])].join("\n");

const textSection = (title: string, value: string): string => [`## ${title}`, value].join("\n");

const sectionPattern = /^##\s+(.+?)\s*$/gm;

const parseSections = (markdown: string): Map<string, string> => {
  const sections = new Map<string, string>();
  const matches = [...markdown.matchAll(sectionPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match) {
      continue;
    }
    const title = match[1]?.trim().toLowerCase();
    const start = match.index === undefined ? 0 : match.index + match[0].length;
    const nextMatch = matches[index + 1];
    const end = nextMatch?.index ?? markdown.length;
    if (title) {
      sections.set(title, markdown.slice(start, end).trim());
    }
  }

  return sections;
};

const parseList = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) {
    return fallback;
  }

  const items = value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
};

const parseText = (value: string | undefined, fallback: string): string => {
  const text = value?.trim();
  return text ? text : fallback;
};

const firstHeading = (markdown: string): string | undefined => {
  const heading = markdown.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
  return heading || undefined;
};

export const summarizePersonaCore = (core: PersonaCore): string => {
  const traits = core.traits.slice(0, 4).join(", ");
  const values = core.values.slice(0, 3).join(", ");
  const sceneCount = core.allowedScenes.length;

  return [
    `${core.name} is a ${core.origin} persona core`,
    traits ? `with traits: ${traits}` : undefined,
    values ? `and values: ${values}` : undefined,
    `It is scoped to ${sceneCount} allowed scene${sceneCount === 1 ? "" : "s"} and keeps safety policy separate from editable persona text.`
  ]
    .filter(Boolean)
    .join(" ");
};

export const coreToEditableMarkdown = (core: PersonaCore): string =>
  [
    `# ${core.name}`,
    "",
    `Core ID: ${core.id}`,
    `Origin: ${core.origin}`,
    `Locale: ${core.contentLanguage}`,
    "",
    textSection("Summary", summarizePersonaCore(core)),
    "",
    listSection("Traits", core.traits),
    "",
    listSection("Values", core.values),
    "",
    textSection("Speech Style", core.speechStyle),
    "",
    textSection("Emotional Style", core.emotionalStyle),
    "",
    textSection("Relationship Style", core.relationshipStyle),
    "",
    listSection("Behavior Patterns", core.behaviorPatterns),
    "",
    listSection("Allowed Scenes", core.allowedScenes),
    "",
    listSection("Evaluator Rules", core.evaluatorRules),
    "",
    "<!-- Safety fields below are read-only for markdown editing. -->",
    "",
    listSection("Safety Constraints", core.safetyConstraints),
    "",
    listSection("Forbidden Behaviors", core.forbiddenBehaviors),
    "",
    textSection("Context Isolation Policy", core.contextIsolationPolicy)
  ].join("\n");

export const buildPersonaMarkdownDocument = (core: PersonaCore): PersonaMarkdownDocument => ({
  id: `${core.id}_persona_markdown`,
  title: `${core.name} persona markdown`,
  locale: core.contentLanguage,
  category: core.origin === "novel_import" ? "novel_persona_core" : "persona_core",
  body: coreToEditableMarkdown(core),
  summary: summarizePersonaCore(core),
  sourceRefs: [`persona-core:${core.id}`, `persona-origin:${core.origin}`],
  createdAt: core.createdAt,
  updatedAt: core.updatedAt
});

export const applyPersonaMarkdown = (core: PersonaCore, markdown: string): PersonaCore => {
  const sections = parseSections(markdown);
  const updatedCore: PersonaCore = {
    ...core,
    name: firstHeading(markdown) ?? core.name,
    traits: parseList(sections.get("traits"), core.traits),
    values: parseList(sections.get("values"), core.values),
    speechStyle: parseText(sections.get("speech style"), core.speechStyle),
    emotionalStyle: parseText(sections.get("emotional style"), core.emotionalStyle),
    relationshipStyle: parseText(sections.get("relationship style"), core.relationshipStyle),
    behaviorPatterns: parseList(sections.get("behavior patterns"), core.behaviorPatterns),
    allowedScenes: parseList(sections.get("allowed scenes"), core.allowedScenes),
    evaluatorRules: parseList(sections.get("evaluator rules"), core.evaluatorRules),
    updatedAt: nowIso()
  };

  const previousDocuments = core.markdownDocuments ?? [];
  const document = buildPersonaMarkdownDocument(updatedCore);

  return {
    ...updatedCore,
    markdownDocuments:
      previousDocuments.length > 0
        ? previousDocuments.map((item, index) => (index === 0 ? { ...document, createdAt: item.createdAt } : item))
        : [document]
  };
};
