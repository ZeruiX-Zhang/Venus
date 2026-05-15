import type {
  ToolPermission,
  ToolRiskLevel
} from "@personal-character-agent/shared";

export interface ToolContext {
  userId?: string;
  sessionId: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permission: ToolPermission;
  riskLevel: ToolRiskLevel;
  enabled: boolean;
  run?: (input: unknown, context: ToolContext) => Promise<unknown>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, { ...tool, enabled: tool.enabled === true });
  }

  listEnabledTools(): ToolDefinition[] {
    return [...this.tools.values()].filter((tool) => tool.enabled);
  }

  listAllTools(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
}

export const createDefaultToolRegistry = (): ToolRegistry => new ToolRegistry();
