import type { AgentTrace, AgentTraceStep, RuntimeMode } from "./types";

const nowIso = (): string => new Date().toISOString();

const makeId = (prefix: string): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 12)}`;

export class TraceRecorder {
  readonly trace: AgentTrace;

  constructor(mode: RuntimeMode) {
    this.trace = {
      traceId: makeId("trace"),
      workflowName: "UserMessageWorkflow",
      mode,
      startedAt: nowIso(),
      steps: [],
      warnings: []
    };
  }

  startStep(id: string, name: string, inputSummary?: string): AgentTraceStep {
    const step: AgentTraceStep = {
      id,
      name,
      startedAt: nowIso(),
      status: "running",
      warnings: []
    };
    if (inputSummary) {
      step.inputSummary = inputSummary;
    }
    this.trace.steps.push(step);
    return step;
  }

  completeStep(
    step: AgentTraceStep,
    outputSummary?: string,
    warnings: string[] = []
  ): void {
    step.status = "completed";
    step.endedAt = nowIso();
    if (outputSummary) {
      step.outputSummary = outputSummary;
    }
    step.warnings.push(...warnings);
    this.trace.warnings.push(...warnings);
  }

  failStep(step: AgentTraceStep, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    step.status = "failed";
    step.endedAt = nowIso();
    step.outputSummary = message;
    this.trace.error = message;
  }

  finish(error?: unknown): AgentTrace {
    if (error) {
      this.trace.error = error instanceof Error ? error.message : String(error);
    }
    this.trace.endedAt = nowIso();
    return this.trace;
  }
}
