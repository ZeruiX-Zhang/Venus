export const mastraLogicalAgentIds = [
  "companion-orchestrator",
  "safety-agent",
  "persona-agent",
  "memory-agent",
  "knowledge-agent",
  "conversation-agent",
  "action-agent",
  "avatar-agent",
  "evaluation-agent"
] as const;

export type MastraLogicalAgentId = (typeof mastraLogicalAgentIds)[number];
