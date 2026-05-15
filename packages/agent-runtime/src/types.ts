import type { ModelClient } from "@personal-character-agent/agent-core";
import type { AvatarEventBus } from "@personal-character-agent/avatar-core/events";
import type { MemoryStore } from "@personal-character-agent/memory-core";
import type {
  AvatarState,
  CharacterProfile,
  ISODateTime,
  MemoryItem,
  MemoryType,
  ModelProviderConfig,
  SoulCard
} from "@personal-character-agent/shared";
import type { AuditLog } from "./security/auditLog";
import type { PermissionName, PermissionPolicy } from "./security/permissions";
import type { Retriever, RetrievedKnowledge } from "./knowledge/retrieval";
import type { SecretStore } from "./secrets/secretStore";
import type {
  MemoryPacket,
  MemorySkillId,
  MemoryWriteSuggestion
} from "@personal-character-agent/memory-runtime";
import type {
  PersonaCore,
  PersonaEvaluationResult,
  PersonalityMatrix
} from "@personal-character-agent/persona-runtime";
import type {
  SafetyProfile,
  SafetyResult
} from "@personal-character-agent/safety-runtime";
import type { ModelProviderSettings } from "@personal-character-agent/model-gateway";

export type RuntimeMode = "mock" | "local" | "cloud";
export type ResponseLanguage = "zh" | "en";

export type IntentType =
  | "chat"
  | "memory_query"
  | "knowledge_query"
  | "persona_import"
  | "settings_change"
  | "action_request";

export type MemoryWriteMode = "auto_off" | "ask" | "auto_safe";

export type ActionRiskLevel = "low" | "medium" | "high" | "critical";

export interface RuntimeConfig {
  mode: RuntimeMode;
  developerMode: boolean;
  strictMode: boolean;
  memoryWriteMode: MemoryWriteMode;
  modelProvider: ModelProviderConfig;
  modelGatewaySettings?: ModelProviderSettings;
  responseLanguage?: ResponseLanguage;
  safetyProfile?: SafetyProfile;
  personalityMatrix?: PersonalityMatrix;
  enabledMemorySkillIds?: MemorySkillId[];
  sessionId?: string;
  userId?: string;
  modelClient?: ModelClient;
  permissionPolicy?: PermissionPolicy;
  auditLog?: AuditLog;
  retriever?: Retriever;
  secretStore?: SecretStore;
}

export interface AgentState {
  sessionId: string;
  activeCharacterId: string;
  activeSoulCardId: string;
  avatarState: AvatarState;
  lastIntent?: IntentType;
  relevantMemories: MemoryItem[];
  knowledgeResults: RetrievedKnowledge[];
  warnings: string[];
}

export interface AgentContext {
  traceId: string;
  config: RuntimeConfig;
  soulCard: SoulCard;
  characterProfile: CharacterProfile;
  memoryStore: MemoryStore;
  avatarEventBus: AvatarEventBus;
  permissionPolicy: PermissionPolicy;
  auditLog: AuditLog;
  retriever: Retriever;
  modelClient: ModelClient;
  state: AgentState;
}

export type AgentEvent =
  | {
      type: "avatar_state";
      state: AvatarState;
      message?: string;
      timestamp: ISODateTime;
    }
  | {
      type: "workflow_step";
      stepId: string;
      status: "started" | "completed" | "failed";
      timestamp: ISODateTime;
    }
  | {
      type: "permission_decision";
      permission: PermissionName;
      allowed: boolean;
      requiresConfirmation: boolean;
      timestamp: ISODateTime;
    }
  | {
      type: "memory_suggestion";
      suggestionId: string;
      timestamp: ISODateTime;
    }
  | {
      type: "warning";
      message: string;
      timestamp: ISODateTime;
    }
  | {
      type: "error";
      message: string;
      timestamp: ISODateTime;
    };

export interface AgentTraceStep {
  id: string;
  name: string;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  status: "running" | "completed" | "failed" | "skipped";
  inputSummary?: string;
  outputSummary?: string;
  warnings: string[];
}

export interface AgentTrace {
  traceId: string;
  workflowName: "UserMessageWorkflow";
  mode: RuntimeMode;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  steps: AgentTraceStep[];
  warnings: string[];
  error?: string;
}

export class AgentError extends Error {
  readonly code: string;
  readonly traceId?: string;
  readonly recoverable: boolean;

  constructor(
    code: string,
    message: string,
    options: { traceId?: string; recoverable?: boolean } = {}
  ) {
    super(message);
    this.name = "AgentError";
    this.code = code;
    this.recoverable = options.recoverable ?? true;
    if (options.traceId) {
      this.traceId = options.traceId;
    }
  }
}

export interface VoiceDirective {
  enabled: boolean;
  provider: "none" | "browser_tts" | "external";
  utterance: string;
  emotion?: AvatarState;
  voiceId?: string;
}

export interface MemorySuggestion {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  tags: string[];
  reason: string;
  sensitivity: "none" | "potential_sensitive";
  approvalRequired: boolean;
}

export interface ToolActionRecord {
  id: string;
  toolName: string;
  permission: PermissionName;
  riskLevel: ActionRiskLevel;
  status: "proposed" | "blocked" | "requires_confirmation" | "completed";
  summary: string;
}

export interface RuntimeDebugInfo {
  intent: IntentType;
  normalizedInput: string;
  personaContext: string;
  memoryCount: number;
  knowledgeCount: number;
  mastraStatus: string;
  warnings: string[];
  selectedMemorySkillIds?: MemorySkillId[];
  recalledMemoryPackets?: MemoryPacket[];
  activePersonaCores?: PersonaCore[];
  safetyProfile?: SafetyProfile;
  contextPreview?: string;
}

export interface AgentWorkflowResult {
  text: string;
  avatarEvents: AgentEvent[];
  voiceDirectives: VoiceDirective[];
  memorySuggestions: MemorySuggestion[];
  activePersonaCores?: PersonaCore[];
  recalledMemoryPackets?: MemoryPacket[];
  memoryWriteSuggestions?: MemoryWriteSuggestion[];
  safetyResult?: SafetyResult;
  evaluatorResult?: PersonaEvaluationResult;
  toolActions: ToolActionRecord[];
  traceId: string;
  warnings: string[];
  debugInfo?: RuntimeDebugInfo;
}
