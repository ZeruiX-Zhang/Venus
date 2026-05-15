export type PersonaCoreId =
  | "base_core"
  | "novel_core"
  | "user_created_core"
  | "reality_based_core"
  | "scene_core"
  | "minor_safe_core"
  | string;

export type PersonaOrigin =
  | "novel_import"
  | "user_created"
  | "reality_based"
  | "system_template";

export type ContentLanguage = "zh" | "en" | "mixed";

export interface PersonaMarkdownDocument {
  id: string;
  title: string;
  locale: ContentLanguage;
  category: string;
  body: string;
  summary: string;
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonaCore {
  id: PersonaCoreId;
  name: string;
  origin: PersonaOrigin;
  contentLanguage: ContentLanguage;
  traits: string[];
  values: string[];
  speechStyle: string;
  emotionalStyle: string;
  relationshipStyle: string;
  behaviorPatterns: string[];
  allowedScenes: string[];
  forbiddenBehaviors: string[];
  safetyConstraints: string[];
  contextIsolationPolicy: string;
  evaluatorRules: string[];
  active: boolean;
  locked: boolean;
  markdownDocuments?: PersonaMarkdownDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityMatrix {
  characterName: string;
  defaultContentLanguage: ContentLanguage;
  cores: PersonaCore[];
  activeCoreIds: PersonaCoreId[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonaSelectionState {
  mode: "companion" | "roleplay" | "work" | "study" | "creative";
  currentScene: string;
  safetyMode: "adult" | "minor" | "strict" | "custom";
  manuallyActiveCoreIds?: PersonaCoreId[];
}

export interface PersonaEvaluationResult {
  passed: boolean;
  score: number;
  issues: Array<{
    rule: string;
    severity: "info" | "warning" | "error";
    message: string;
  }>;
}

export interface NovelCharacterCandidate {
  id: string;
  name: string;
  contentLanguage: ContentLanguage;
  archetype: string;
  confidence: number;
  derivedTraits: string[];
  speechHints: string[];
  motivationHints: string[];
  relationshipHints: string[];
  evidenceSummary: string;
}

export interface PersonaPreview {
  candidateId: string;
  sample: string;
  evaluatorResult: PersonaEvaluationResult;
}
