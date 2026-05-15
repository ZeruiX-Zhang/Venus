import type {
  AgentContext,
  AgentState,
  RuntimeConfig
} from "./types";
import type { AvatarEventBus } from "@personal-character-agent/avatar-core/events";
import type { MemoryStore } from "@personal-character-agent/memory-core";
import type {
  CharacterProfile,
  SoulCard
} from "@personal-character-agent/shared";
import { LocalKeywordRetriever } from "./knowledge/retrieval";
import { InMemoryAuditLog } from "./security/auditLog";
import { PermissionPolicy } from "./security/permissions";
import { createRuntimeModelClient } from "./config";
import { UserMessageWorkflow } from "./workflow/userMessageWorkflow";
import { MastraRuntime } from "./mastra/mastraRuntime";
import type { AgentTrace, AgentWorkflowResult } from "./types";

const makeId = (prefix: string): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 12)}`;

export interface CompanionOrchestratorOptions {
  config: RuntimeConfig;
  soulCard: SoulCard;
  characterProfile: CharacterProfile;
  memoryStore: MemoryStore;
  avatarEventBus: AvatarEventBus;
  mastraRuntime?: MastraRuntime;
  onTrace?: (trace: AgentTrace) => void;
}

export class CompanionOrchestrator {
  private readonly workflow: UserMessageWorkflow;
  private readonly mastraRuntime: MastraRuntime;

  constructor(private readonly options: CompanionOrchestratorOptions) {
    this.mastraRuntime = options.mastraRuntime ?? new MastraRuntime();
    this.workflow = new UserMessageWorkflow({
      mastraRuntime: this.mastraRuntime,
      onTraceComplete: (trace) => options.onTrace?.(trace)
    });
  }

  async handleUserMessage(message: string): Promise<AgentWorkflowResult> {
    const config = this.options.config;
    const state: AgentState = {
      sessionId: config.sessionId ?? makeId("session"),
      activeCharacterId: this.options.characterProfile.id,
      activeSoulCardId: this.options.soulCard.id,
      avatarState: this.options.avatarEventBus.getState(),
      relevantMemories: [],
      knowledgeResults: [],
      warnings: []
    };

    const context: AgentContext = {
      traceId: makeId("trace_pending"),
      config,
      soulCard: this.options.soulCard,
      characterProfile: this.options.characterProfile,
      memoryStore: this.options.memoryStore,
      avatarEventBus: this.options.avatarEventBus,
      permissionPolicy: config.permissionPolicy ?? new PermissionPolicy(),
      auditLog: config.auditLog ?? new InMemoryAuditLog(),
      retriever: config.retriever ?? new LocalKeywordRetriever(this.options.soulCard.knowledge),
      modelClient:
        config.modelClient ??
        createRuntimeModelClient(config.mode, config.modelProvider),
      state
    };

    return this.workflow.run({ message }, context);
  }

  getMastraRuntime(): MastraRuntime {
    return this.mastraRuntime;
  }
}
