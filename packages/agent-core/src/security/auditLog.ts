import type { ISODateTime, ToolRiskLevel } from "@personal-character-agent/shared";

export interface AuditLogEntry {
  id: string;
  timestamp: ISODateTime;
  actor: "user" | "assistant" | "system";
  action: string;
  toolName?: string;
  riskLevel?: ToolRiskLevel;
  details?: Record<string, unknown>;
}

export interface AuditLog {
  record(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry>;
  list(): Promise<AuditLogEntry[]>;
  clear(): Promise<void>;
}

export class InMemoryAuditLog implements AuditLog {
  private entries: AuditLogEntry[] = [];

  async record(
    entry: Omit<AuditLogEntry, "id" | "timestamp">
  ): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Math.random().toString(36).slice(2, 12)}`,
      timestamp: new Date().toISOString()
    };
    this.entries = [fullEntry, ...this.entries];
    return fullEntry;
  }

  async list(): Promise<AuditLogEntry[]> {
    return [...this.entries];
  }

  async clear(): Promise<void> {
    this.entries = [];
  }
}
