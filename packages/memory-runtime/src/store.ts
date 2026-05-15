import type { MemoryRecord, MemorySkillStore } from "./types";

export class InMemoryMemorySkillStore implements MemorySkillStore {
  private records: MemoryRecord[];

  constructor(initialRecords: MemoryRecord[] = []) {
    this.records = cloneRecords(initialRecords);
  }

  async listRecords(): Promise<MemoryRecord[]> {
    return cloneRecords(this.records).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async upsertRecord(record: MemoryRecord): Promise<MemoryRecord> {
    const index = this.records.findIndex((item) => item.id === record.id);
    const next = cloneRecord(record);
    if (index >= 0) {
      this.records = [...this.records.slice(0, index), next, ...this.records.slice(index + 1)];
    } else {
      this.records = [next, ...this.records];
    }
    return cloneRecord(next);
  }

  async deleteRecord(id: string): Promise<void> {
    this.records = this.records.filter((record) => record.id !== id);
  }

  async deleteAll(): Promise<void> {
    this.records = [];
  }

  async exportRecords(): Promise<MemoryRecord[]> {
    return cloneRecords(this.records);
  }
}

export class BrowserStorageMemorySkillStore extends InMemoryMemorySkillStore {
  private initialized = false;

  constructor(private readonly storageKey: string) {
    super();
  }

  override async listRecords(): Promise<MemoryRecord[]> {
    await this.ensureInitialized();
    return super.listRecords();
  }

  override async upsertRecord(record: MemoryRecord): Promise<MemoryRecord> {
    await this.ensureInitialized();
    const saved = await super.upsertRecord(record);
    await this.persist();
    return saved;
  }

  override async deleteRecord(id: string): Promise<void> {
    await this.ensureInitialized();
    await super.deleteRecord(id);
    await this.persist();
  }

  override async deleteAll(): Promise<void> {
    await this.ensureInitialized();
    await super.deleteAll();
    await this.persist();
  }

  override async exportRecords(): Promise<MemoryRecord[]> {
    await this.ensureInitialized();
    return super.exportRecords();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }
    const raw = globalThis.localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as MemoryRecord[];
      if (Array.isArray(parsed)) {
        for (const record of parsed) {
          await super.upsertRecord(record);
        }
      }
    } catch {
      await super.deleteAll();
    }
  }

  private async persist(): Promise<void> {
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }
    globalThis.localStorage.setItem(this.storageKey, JSON.stringify(await super.exportRecords()));
  }
}

export const cloneRecord = (record: MemoryRecord): MemoryRecord => ({
  ...record,
  safetyTags: [...record.safetyTags],
  sourceMetadata: { ...record.sourceMetadata }
});

export const cloneRecords = (records: MemoryRecord[]): MemoryRecord[] =>
  records.map(cloneRecord);
