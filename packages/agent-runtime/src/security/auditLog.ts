import type { ISODateTime } from "@personal-character-agent/shared";
import type { ActionRiskLevel } from "../types";
import type { PermissionName } from "./permissions";

export interface AuditLogEntry {
  id: string;
  timestamp: ISODateTime;
  actor: "user" | "assistant" | "system";
  action: string;
  permission?: PermissionName;
  riskLevel?: ActionRiskLevel;
  traceId?: string;
  details?: Record<string, unknown>;
}

export interface AuditLog {
  record(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry>;
  list(): Promise<AuditLogEntry[]>;
  clear(): Promise<void>;
}

const makeId = (): string =>
  `audit_${Math.random().toString(36).slice(2, 12)}`;

export class InMemoryAuditLog implements AuditLog {
  private entries: AuditLogEntry[] = [];

  async record(
    entry: Omit<AuditLogEntry, "id" | "timestamp">
  ): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: makeId(),
      timestamp: new Date().toISOString()
    };
    this.entries = [fullEntry, ...this.entries];
    return fullEntry;
  }

  async list(): Promise<AuditLogEntry[]> {
    return this.entries.map((entry) => ({ ...entry }));
  }

  async clear(): Promise<void> {
    this.entries = [];
  }
}
