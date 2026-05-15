import type { ActionRiskLevel } from "../types";

export type PermissionName =
  | "memory_read"
  | "memory_write"
  | "knowledge_read"
  | "file_read"
  | "file_write"
  | "shell_execute"
  | "browser_control"
  | "send_message"
  | "network_request";

export interface PermissionRule {
  permission: PermissionName;
  enabled: boolean;
  description: string;
  defaultRisk: ActionRiskLevel;
}

export interface PermissionDecision {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

export interface PermissionPolicyOptions {
  rules?: Partial<Record<PermissionName, boolean>>;
  confirmationRiskAtOrAbove?: ActionRiskLevel;
}

const riskRank: Record<ActionRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export const defaultPermissionRules: PermissionRule[] = [
  {
    permission: "memory_read",
    enabled: true,
    description: "Read local user-approved companion memories.",
    defaultRisk: "low"
  },
  {
    permission: "memory_write",
    enabled: true,
    description: "Suggest or save user-approved companion memories.",
    defaultRisk: "medium"
  },
  {
    permission: "knowledge_read",
    enabled: true,
    description: "Retrieve local knowledge snippets for context.",
    defaultRisk: "low"
  },
  {
    permission: "file_read",
    enabled: false,
    description: "Read files outside the approved import flow.",
    defaultRisk: "high"
  },
  {
    permission: "file_write",
    enabled: false,
    description: "Write files to disk.",
    defaultRisk: "high"
  },
  {
    permission: "shell_execute",
    enabled: false,
    description: "Execute shell commands.",
    defaultRisk: "critical"
  },
  {
    permission: "browser_control",
    enabled: false,
    description: "Control a browser or desktop UI.",
    defaultRisk: "high"
  },
  {
    permission: "send_message",
    enabled: false,
    description: "Send messages to external services.",
    defaultRisk: "high"
  },
  {
    permission: "network_request",
    enabled: false,
    description: "Make arbitrary network requests.",
    defaultRisk: "high"
  }
];

export class PermissionPolicy {
  private readonly enabled = new Map<PermissionName, boolean>();
  private readonly confirmationThreshold: ActionRiskLevel;

  constructor(options: PermissionPolicyOptions = {}) {
    for (const rule of defaultPermissionRules) {
      this.enabled.set(
        rule.permission,
        options.rules?.[rule.permission] ?? rule.enabled
      );
    }
    this.confirmationThreshold = options.confirmationRiskAtOrAbove ?? "high";
  }

  decide(
    permission: PermissionName,
    riskLevel: ActionRiskLevel
  ): PermissionDecision {
    const allowed = this.enabled.get(permission) === true;
    if (!allowed) {
      return {
        allowed: false,
        requiresConfirmation: riskRank[riskLevel] >= riskRank.medium,
        reason: `${permission} is disabled by policy.`
      };
    }

    return {
      allowed: true,
      requiresConfirmation:
        riskRank[riskLevel] >= riskRank[this.confirmationThreshold],
      reason: `${permission} is allowed by policy.`
    };
  }

  isEnabled(permission: PermissionName): boolean {
    return this.enabled.get(permission) === true;
  }

  setEnabled(permission: PermissionName, enabled: boolean): void {
    this.enabled.set(permission, enabled);
  }

  matrix(): PermissionRule[] {
    return defaultPermissionRules.map((rule) => ({
      ...rule,
      enabled: this.enabled.get(rule.permission) === true
    }));
  }
}

export const requiresConfirmation = (
  riskLevel: ActionRiskLevel,
  threshold: ActionRiskLevel = "high"
): boolean => riskRank[riskLevel] >= riskRank[threshold];
