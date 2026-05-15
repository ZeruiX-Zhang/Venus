import type { MemoryItem } from "@personal-character-agent/shared";
import {
  AgentError,
  type AgentContext,
  type AgentEvent,
  type AgentWorkflowResult,
  type IntentType,
  type MemorySuggestion,
  type RuntimeDebugInfo,
  type ToolActionRecord
} from "../types";
import { TraceRecorder } from "../tracing";
import { createRuntimeAgents, type ConversationDraft } from "../agents";
import type { MastraRuntime } from "../mastra/mastraRuntime";

export interface UserMessageWorkflowInput {
  message: string;
}

export interface UserMessageWorkflowDependencies {
  mastraRuntime: MastraRuntime;
  onTraceComplete?: (trace: TraceRecorder["trace"]) => void;
}

const normalizeInput = (message: string): string =>
  message.replace(/\s+/g, " ").trim();

const summarize = (value: unknown): string => {
  if (typeof value === "string") {
    return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  return JSON.stringify(value).slice(0, 140);
};

export class UserMessageWorkflow {
  private readonly agents = createRuntimeAgents();

  constructor(private readonly dependencies: UserMessageWorkflowDependencies) {}

  async run(
    input: UserMessageWorkflowInput,
    context: AgentContext
  ): Promise<AgentWorkflowResult> {
    const trace = new TraceRecorder(context.config.mode);
    context.traceId = trace.trace.traceId;
    const events: AgentEvent[] = [];
    let normalizedInput = "";
    let intent: IntentType = "chat";
    let personaContext = "";
    let knowledgeContext = "";
    let memorySuggestions: MemorySuggestion[] = [];
    let savedMemories: MemoryItem[] = [];
    let toolActions: ToolActionRecord[] = [];
    let draft: ConversationDraft | undefined;

    const runStep = async <T>(
      id: string,
      name: string,
      action: () => Promise<T>,
      inputSummary?: string
    ): Promise<T> => {
      const step = trace.startStep(id, name, inputSummary);
      events.push({
        type: "workflow_step",
        stepId: id,
        status: "started",
        timestamp: new Date().toISOString()
      });
      try {
        const result = await action();
        trace.completeStep(step, summarize(result));
        events.push({
          type: "workflow_step",
          stepId: id,
          status: "completed",
          timestamp: new Date().toISOString()
        });
        return result;
      } catch (error) {
        trace.failStep(step, error);
        events.push({
          type: "workflow_step",
          stepId: id,
          status: "failed",
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };

    try {
      await this.dependencies.mastraRuntime.initialize();

      normalizedInput = await runStep(
        "normalize_input",
        "Normalize input",
        async () => normalizeInput(input.message),
        input.message
      );

      this.agents.avatarAgent.emit(
        context,
        "listening",
        events,
        "User message received"
      );

      const preCheck = await runStep(
        "safety_precheck",
        "Safety pre-check",
        async () => this.agents.safetyGuard.preCheck(normalizedInput, context),
        normalizedInput
      );
      context.state.warnings.push(...preCheck.warnings);
      if (!preCheck.allowed && preCheck.riskLevel !== "medium") {
        throw new AgentError(
          "SAFETY_PRECHECK_BLOCKED",
          preCheck.reasons.join(" ") || "Message blocked by safety policy.",
          { traceId: context.traceId, recoverable: true }
        );
      }

      intent = await runStep(
        "intent_classification",
        "Intent classification",
        async () => this.agents.intentClassifier.classify(normalizedInput),
        normalizedInput
      );
      context.state.lastIntent = intent;

      this.agents.avatarAgent.emit(context, "thinking", events);

      context.state.relevantMemories = await runStep(
        "memory_retrieval",
        "Retrieve relevant memories",
        async () => this.agents.memoryAgent.retrieveRelevant(normalizedInput, context),
        normalizedInput
      );

      context.state.knowledgeResults = await runStep(
        "knowledge_retrieval",
        "Retrieve relevant knowledge",
        async () => this.agents.knowledgeAgent.retrieve(normalizedInput, intent, context),
        normalizedInput
      );

      personaContext = await runStep(
        "persona_context",
        "Build persona context",
        async () => this.agents.personaAgent.buildPersonaContext(context)
      );

      knowledgeContext = await runStep(
        "knowledge_context",
        "Build knowledge context",
        async () => this.agents.knowledgeAgent.buildKnowledgeContext(context)
      );

      toolActions = await runStep(
        "action_planning",
        "Plan safe actions",
        async () => this.agents.actionAgent.plan(normalizedInput, intent, context)
      );

      const generatedDraft = await runStep(
        "response_generation",
        "Generate character response",
        async () =>
          this.agents.conversationAgent.generate(
            normalizedInput,
            intent,
            personaContext,
            knowledgeContext,
            context
          )
      );
      draft = generatedDraft;

      const postCheck = await runStep(
        "safety_postcheck",
        "Safety post-check",
        async () => this.agents.safetyGuard.postCheck(generatedDraft.text, context),
        generatedDraft.text
      );
      context.state.warnings.push(...postCheck.warnings);
      if (!postCheck.allowed && context.config.strictMode) {
        throw new AgentError(
          "SAFETY_POSTCHECK_BLOCKED",
          postCheck.reasons.join(" ") || "Output blocked by safety policy.",
          { traceId: context.traceId, recoverable: true }
        );
      }

      const evaluation = await runStep(
        "evaluation",
        "Evaluate final output",
        async () =>
          this.agents.evaluationAgent.evaluate(
            generatedDraft.text,
            this.agents.personaAgent,
            context,
            toolActions
          ),
        generatedDraft.text
      );
      if (!evaluation.passed) {
        context.state.warnings.push(...evaluation.reasons);
        if (context.config.strictMode) {
          throw new AgentError(
            "EVALUATION_FAILED",
            evaluation.reasons.join(" "),
            { traceId: context.traceId, recoverable: true }
          );
        }
      }

      await runStep("avatar_events", "Emit avatar events", async () => {
        for (const state of this.agents.avatarAgent.finalStatesFor(generatedDraft.emotion)) {
          this.agents.avatarAgent.emit(context, state, events);
        }
        return events.filter((event) => event.type === "avatar_state");
      });

      memorySuggestions = await runStep(
        "memory_suggestions",
        "Suggest memory writes",
        async () => this.agents.memoryAgent.suggestWrites(normalizedInput, context),
        normalizedInput
      );
      for (const suggestion of memorySuggestions) {
        events.push({
          type: "memory_suggestion",
          suggestionId: suggestion.id,
          timestamp: new Date().toISOString()
        });
      }

      savedMemories = await runStep(
        "memory_auto_save",
        "Auto-save approved safe memories",
        async () => this.agents.memoryAgent.maybeAutoSave(memorySuggestions, context)
      );
      if (savedMemories.length > 0) {
        context.state.warnings.push(
          `${savedMemories.length} non-sensitive memory saved by auto-save policy.`
        );
      }

      const warnings = [...new Set(context.state.warnings)];
      const debugInfo = await this.createDebugInfo(
        intent,
        normalizedInput,
        personaContext,
        warnings,
        context
      );

      return {
        text: generatedDraft.text,
        avatarEvents: events,
        voiceDirectives: generatedDraft.voiceDirectives,
        memorySuggestions,
        toolActions,
        traceId: trace.trace.traceId,
        warnings,
        ...(context.config.developerMode ? { debugInfo } : {})
      };
    } catch (error) {
      this.agents.avatarAgent.emit(context, "error", events);
      const message =
        error instanceof AgentError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);
      context.state.warnings.push(message);
      return {
        text: `${context.soulCard.character_name}: I hit a runtime guardrail: ${message}`,
        avatarEvents: events,
        voiceDirectives: [
          {
            enabled: false,
            provider: "none",
            utterance: message,
            emotion: "error"
          }
        ],
        memorySuggestions: [],
        toolActions,
        traceId: trace.trace.traceId,
        warnings: [...new Set(context.state.warnings)],
        ...(context.config.developerMode
          ? {
              debugInfo: await this.createDebugInfo(
                intent,
                normalizedInput,
                personaContext,
                [...new Set(context.state.warnings)],
                context
              )
            }
          : {})
      };
    } finally {
      const completed = trace.finish();
      this.dependencies.onTraceComplete?.(completed);
    }
  }

  private async createDebugInfo(
    intent: IntentType,
    normalizedInput: string,
    personaContext: string,
    warnings: string[],
    context: AgentContext
  ): Promise<RuntimeDebugInfo> {
    const status = await this.dependencies.mastraRuntime.getStatus();
    return {
      intent,
      normalizedInput,
      personaContext,
      memoryCount: context.state.relevantMemories.length,
      knowledgeCount: context.state.knowledgeResults.length,
      mastraStatus: status.summary,
      warnings
    };
  }
}
