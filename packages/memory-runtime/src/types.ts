export type ISODateTime = string;

export type RetrievalMode =
  | "always_on"
  | "keyword"
  | "semantic"
  | "hybrid"
  | "manual";

export type MemoryPriority = "critical" | "high" | "medium" | "low";

export type ConflictPolicy =
  | "ask_user"
  | "merge"
  | "latest_wins"
  | "never_overwrite";

export type MemorySkillId =
  | "user_preference_memory"
  | "relationship_memory"
  | "task_context_memory"
  | "novel_lore_memory"
  | "persona_behavior_memory"
  | "journal_memory"
  | "knowledge_memory"
  | "safety_memory";

export type CoreMemoryBlockId =
  | "active_character_identity"
  | "active_persona_core"
  | "user_profile_summary"
  | "relationship_contract"
  | "safety_profile"
  | "current_scene";

export interface TtlPolicy {
  kind: "none" | "session" | "expires_after_days";
  days?: number;
}

export interface MemorySkill {
  id: MemorySkillId;
  name: string;
  description: string;
  displayName?: Record<"zh" | "en", string>;
  displayDescription?: Record<"zh" | "en", string>;
  editable?: boolean;
  userSelectable?: boolean;
  correctionHints?: string[];
  readTriggers: string[];
  writeTriggers: string[];
  retrievalMode: RetrievalMode;
  priority: MemoryPriority;
  maxContextTokens: number;
  requiresUserApproval: boolean;
  userEditable: boolean;
  conflictPolicy: ConflictPolicy;
  namespace: string;
  ttlPolicy: TtlPolicy;
  safetyTags: string[];
  enabled: boolean;
}

export interface MemoryRecord {
  id: string;
  skillId: MemorySkillId;
  namespace: string;
  content: string;
  summary?: string;
  source: "user" | "assistant" | "system" | "import";
  sourceMetadata: Record<string, string | number | boolean>;
  priority: MemoryPriority;
  safetyTags: string[];
  userEditable: boolean;
  approvalStatus: "approved" | "pending" | "rejected" | "conflict";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  expiresAt?: ISODateTime;
}

export interface MemoryPacket {
  id: string;
  skillId?: MemorySkillId;
  coreBlockId?: CoreMemoryBlockId;
  namespace: string;
  content: string;
  priority: MemoryPriority;
  tokenEstimate: number;
  reason: string;
  source: "core" | "memory" | "knowledge";
  sourceMetadata: Record<string, string | number | boolean>;
}

export interface MemoryAgentState {
  characterName: string;
  activePersonaSummary: string;
  userProfileSummary: string;
  relationshipContract: string;
  safetyMode: "adult" | "minor" | "strict" | "custom";
  currentScene: string;
  developerMode: boolean;
  language?: "zh" | "en";
  enabledMemorySkillIds?: MemorySkillId[];
}

export interface MemoryRetrievalBudget {
  maxTotalTokens: number;
  maxPackets?: number;
}

export interface MemoryCandidate {
  id: string;
  content: string;
  reason: string;
  suggestedSkillId: MemorySkillId;
  source: "user" | "assistant" | "system" | "import";
  priority: MemoryPriority;
  safetyTags: string[];
  sensitivity: "none" | "sensitive";
  conflictWithRecordId?: string;
}

export interface MemoryWriteSuggestion {
  id: string;
  candidate: MemoryCandidate;
  skill: MemorySkill;
  approvalRequired: boolean;
  conflict: boolean;
  existingRecord?: MemoryRecord;
  proposedRecord: MemoryRecord;
  status: "queued" | "saved" | "blocked" | "conflict";
  userFacingMessage: string;
}

export interface MemorySkillStore {
  listRecords(): Promise<MemoryRecord[]>;
  upsertRecord(record: MemoryRecord): Promise<MemoryRecord>;
  deleteRecord(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  exportRecords(): Promise<MemoryRecord[]>;
}
