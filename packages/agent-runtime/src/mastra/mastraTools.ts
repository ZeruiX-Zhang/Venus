export const mastraToolIds = [
  "safe-runtime-status",
  "disabled-shell-execute",
  "disabled-file-write",
  "disabled-browser-control",
  "disabled-network-request"
] as const;

export type MastraToolId = (typeof mastraToolIds)[number];
