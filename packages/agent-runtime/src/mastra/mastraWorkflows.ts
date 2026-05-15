export const mastraWorkflowIds = ["user-message-workflow"] as const;

export type MastraWorkflowId = (typeof mastraWorkflowIds)[number];
