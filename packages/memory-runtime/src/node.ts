import { readFile, writeFile } from "node:fs/promises";
import type { MemoryRecord, MemorySkillStore } from "./types";
import { InMemoryMemorySkillStore } from "./store";

export class FileMemorySkillStore implements MemorySkillStore {
  private readonly delegate = new InMemoryMemorySkillStore();
  private initialized = false;

  constructor(private readonly filePath: string) {}

  async listRecords(): Promise<MemoryRecord[]> {
    await this.ensureInitialized();
    return this.delegate.listRecords();
  }

  async upsertRecord(record: MemoryRecord): Promise<MemoryRecord> {
    await this.ensureInitialized();
    const saved = await this.delegate.upsertRecord(record);
    await this.persist();
    return saved;
  }

  async deleteRecord(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.delegate.deleteRecord(id);
    await this.persist();
  }

  async deleteAll(): Promise<void> {
    await this.ensureInitialized();
    await this.delegate.deleteAll();
    await this.persist();
  }

  async exportRecords(): Promise<MemoryRecord[]> {
    await this.ensureInitialized();
    return this.delegate.exportRecords();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as MemoryRecord[];
      if (Array.isArray(parsed)) {
        for (const record of parsed) {
          await this.delegate.upsertRecord(record);
        }
      }
    } catch {
      await this.delegate.deleteAll();
    }
  }

  private async persist(): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(await this.delegate.exportRecords(), null, 2));
  }
}
