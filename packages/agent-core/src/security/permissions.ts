import {
  ToolPermission,
  type ToolRiskLevel
} from "@personal-character-agent/shared";

export { ToolPermission };
export type { ToolRiskLevel };

export interface PermissionDecision {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason: string;
}

export interface PermissionPolicyOptions {
  allowedPermissions?: ToolPermission[];
  alwaysConfirmRiskAtOrAbove?: ToolRiskLevel;
}

const riskRank: Record<ToolRiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export class PermissionPolicy {
  private readonly allowedPermissions: Set<ToolPermission>;
  private readonly confirmationThreshold: ToolRiskLevel;

  constructor(options: PermissionPolicyOptions = {}) {
    this.allowedPermissions = new Set(options.allowedPermissions ?? []);
    this.confirmationThreshold = options.alwaysConfirmRiskAtOrAbove ?? "medium";
  }

  canRequest(permission: ToolPermission, riskLevel: ToolRiskLevel): PermissionDecision {
    if (!this.allowedPermissions.has(permission)) {
      return {
        allowed: false,
        requiresConfirmation: true,
        reason: "Tool permission is disabled by default."
      };
    }

    return {
      allowed: true,
      requiresConfirmation: requireUserConfirmation(
        permission,
        riskLevel,
        this.confirmationThreshold
      ),
      reason: "Permission is allowed by policy."
    };
  }
}

export function requireUserConfirmation(
  toolName: string,
  riskLevel: ToolRiskLevel,
  threshold: ToolRiskLevel = "medium"
): boolean {
  return riskRank[riskLevel] >= riskRank[threshold];
}
