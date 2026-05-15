import type { AgentContext, ActionRiskLevel } from "../types";
import type { PermissionName } from "./permissions";

export interface SafetyCheckResult {
  allowed: boolean;
  riskLevel: ActionRiskLevel;
  requiresConfirmation: boolean;
  warnings: string[];
  reasons: string[];
}

const injectionPattern =
  /\b(ignore|override|forget|discard)\b.{0,40}\b(system|developer|persona|instruction|safety|policy)\b|\breveal\b.{0,40}\b(system prompt|developer prompt|hidden instruction)\b|\bjailbreak\b/i;

const sensitiveLeakPattern =
  /\b(api[_ -]?key|password|secret token|developer prompt|system prompt)\b/i;

const dangerousActionPatterns: Array<{
  pattern: RegExp;
  permission: PermissionName;
  riskLevel: ActionRiskLevel;
  reason: string;
}> = [
  {
    pattern: /\b(shell|terminal|powershell|bash|cmd|execute|run command)\b/i,
    permission: "shell_execute",
    riskLevel: "critical",
    reason: "Shell execution is disabled by default."
  },
  {
    pattern: /\b(write|overwrite|delete|remove)\b.{0,30}\b(file|folder|directory|disk)\b/i,
    permission: "file_write",
    riskLevel: "high",
    reason: "File writes require an explicit permission gate."
  },
  {
    pattern: /\b(open browser|click|control browser|control desktop)\b/i,
    permission: "browser_control",
    riskLevel: "high",
    reason: "Browser or desktop control is disabled in v0.1."
  },
  {
    pattern: /\b(send|post|email|dm|message)\b.{0,30}\b(to|on)\b/i,
    permission: "send_message",
    riskLevel: "high",
    reason: "External message sending is disabled in v0.1."
  },
  {
    pattern: /\b(fetch|request|download|upload|call api|webhook)\b/i,
    permission: "network_request",
    riskLevel: "high",
    reason: "Arbitrary network requests are disabled by default."
  }
];

export class SafetyGuard {
  async preCheck(
    userInput: string,
    context: AgentContext
  ): Promise<SafetyCheckResult> {
    const warnings: string[] = [];
    const reasons: string[] = [];
    let allowed = true;
    let riskLevel: ActionRiskLevel = "low";
    let requiresConfirmation = false;

    if (!userInput.trim()) {
      return {
        allowed: false,
        riskLevel: "low",
        requiresConfirmation: false,
        warnings: ["Empty messages are not sent to the model."],
        reasons: ["Input was empty after normalization."]
      };
    }

    if (injectionPattern.test(userInput)) {
      warnings.push(
        "Possible prompt-injection attempt detected and isolated from system/persona instructions."
      );
      reasons.push("Input attempted to override hidden or persona instructions.");
      riskLevel = "medium";
    }

    for (const candidate of dangerousActionPatterns) {
      if (!candidate.pattern.test(userInput)) {
        continue;
      }

      const decision = context.permissionPolicy.decide(
        candidate.permission,
        candidate.riskLevel
      );
      await context.auditLog.record({
        actor: "system",
        action: "permission_precheck",
        permission: candidate.permission,
        riskLevel: candidate.riskLevel,
        traceId: context.traceId,
        details: {
          allowed: decision.allowed,
          requiresConfirmation: decision.requiresConfirmation,
          reason: decision.reason
        }
      });
      warnings.push(candidate.reason);
      reasons.push(decision.reason);
      allowed = allowed && decision.allowed && !decision.requiresConfirmation;
      requiresConfirmation = requiresConfirmation || decision.requiresConfirmation;
      riskLevel = candidate.riskLevel;
    }

    return {
      allowed,
      riskLevel,
      requiresConfirmation,
      warnings,
      reasons
    };
  }

  async postCheck(
    outputText: string,
    context: AgentContext
  ): Promise<SafetyCheckResult> {
    const warnings: string[] = [];
    const reasons: string[] = [];
    let allowed = true;

    if (sensitiveLeakPattern.test(outputText)) {
      warnings.push("Output may expose hidden configuration or credentials.");
      reasons.push("Sensitive developer/configuration leakage pattern detected.");
      allowed = false;
    }

    if (!context.config.developerMode && /debugInfo|traceId|Mastra/i.test(outputText)) {
      warnings.push("Normal mode output attempted to expose runtime internals.");
      reasons.push("Developer diagnostics must stay out of user-facing chat.");
      allowed = false;
    }

    if (!outputText.trim()) {
      warnings.push("Assistant output was empty.");
      reasons.push("Empty output is not acceptable.");
      allowed = false;
    }

    return {
      allowed,
      riskLevel: warnings.length > 0 ? "medium" : "low",
      requiresConfirmation: false,
      warnings,
      reasons
    };
  }
}
