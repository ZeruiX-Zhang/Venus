export type ISODateTime = string;

export type OriginMode =
  | "novel_import"
  | "original_character"
  | "reality_based"
  | "blank";

export type AvatarStyle =
  | "placeholder_2d"
  | "placeholder_3d"
  | "procedural_anime"
  | "pixel"
  | "vrm"
  | "live2d";

export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "annoyed"
  | "sleepy"
  | "confused"
  | "error"
  | "hidden"
  | "peeking"
  | "edge_sitting";

export type MemoryType =
  | "preference"
  | "fact"
  | "relationship"
  | "conversation"
  | "system_note";

export type KnowledgeSourceType =
  | "novel_excerpt"
  | "user_note"
  | "profile"
  | "document"
  | "system";

export type ToolRiskLevel = "low" | "medium" | "high" | "critical";

export enum ToolPermission {
  ReadMemory = "read_memory",
  WriteMemory = "write_memory",
  ExportMemory = "export_memory",
  DeleteMemory = "delete_memory",
  ReadKnowledge = "read_knowledge",
  UseNetwork = "use_network",
  UseFileSystem = "use_file_system",
  ExecuteCode = "execute_code",
  ControlDesktop = "control_desktop"
}

export interface SpeechStyle {
  tone: string;
  formality: "casual" | "polite" | "formal";
  verbosity: "short" | "balanced" | "expressive";
  emojiUse: "none" | "rare" | "moderate";
  firstPerson?: string;
  catchphrases: string[];
}

export interface PersonalityTraits {
  openness: number;
  kindness: number;
  assertiveness: number;
  curiosity: number;
  humor: number;
  energy: number;
  tags: string[];
  description?: string;
}

export interface RelationshipProfile {
  role: "companion" | "assistant" | "friend" | "mentor" | "rival" | "custom";
  intimacyLevel: number;
  boundaries: string[];
  userName?: string;
  notes?: string;
}

export interface KnowledgeSource {
  id: string;
  type: KnowledgeSourceType;
  title: string;
  content: string;
  trustLevel: number;
  createdAt: ISODateTime;
}

export interface MemoryPolicy {
  retention: "session_only" | "user_approved" | "long_term";
  autoRemember: boolean;
  sensitiveTopics: "never_store" | "ask_first" | "allow";
  userEditable: boolean;
}

export interface SafetyProfile {
  contentBoundaries: string[];
  disallowedBehaviors: string[];
  crisisEscalation: boolean;
  externalKnowledgeCannotOverridePersona: boolean;
}

export interface SoulCard {
  id: string;
  character_name: string;
  origin_mode: OriginMode;
  speech_style: SpeechStyle;
  personality: PersonalityTraits;
  relationship_to_user: RelationshipProfile;
  behavior: string[];
  knowledge: KnowledgeSource[];
  memory_policy: MemoryPolicy;
  safety: SafetyProfile;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface AvatarProfile {
  id: string;
  displayName: string;
  style: AvatarStyle;
  primaryColor: string;
  accentColor: string;
  assetUri?: string;
  animationMap: Partial<Record<AvatarState, string>>;
}

export interface VoiceProfile {
  id: string;
  displayName: string;
  provider: "none" | "browser_tts" | "external";
  voiceId?: string;
  speed: number;
  pitch: number;
  enabled: boolean;
}

export interface CharacterProfile {
  id: string;
  displayName: string;
  avatar: AvatarProfile;
  voice: VoiceProfile;
  soulCardId?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  source: "user" | "assistant" | "system" | "import";
  userEditable: boolean;
  tags: string[];
}

export interface ModelProviderConfig {
  providerName: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  isDefault: boolean;
  enabled: boolean;
  mockMode: boolean;
  showDebugLogs: boolean;
}

export type AgentEvent =
  | {
      type: "avatar_state";
      state: AvatarState;
      message?: string;
      timestamp: ISODateTime;
    }
  | {
      type: "memory_changed";
      action: "created" | "updated" | "deleted" | "cleared";
      memoryId?: string;
      timestamp: ISODateTime;
    }
  | {
      type: "tool_permission_requested";
      toolName: string;
      riskLevel: ToolRiskLevel;
      timestamp: ISODateTime;
    }
  | {
      type: "debug";
      message: string;
      timestamp: ISODateTime;
    }
  | {
      type: "error";
      message: string;
      timestamp: ISODateTime;
    };

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
