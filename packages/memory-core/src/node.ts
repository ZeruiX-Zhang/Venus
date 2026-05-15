import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { MemoryItem } from "@personal-character-agent/shared";
import type { MemoryPersistenceAdapter } from "./types";

export class FileMemoryPersistenceAdapter implements MemoryPersistenceAdapter {
  constructor(private readonly filePath: string) {}

  async load(): Promise<MemoryItem[]> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as MemoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      const maybeNodeError = error as NodeJS.ErrnoException;
      if (maybeNodeError.code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  async save(items: MemoryItem[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(items, null, 2), "utf8");
  }
}
