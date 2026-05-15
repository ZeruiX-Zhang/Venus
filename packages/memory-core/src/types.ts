import type { MemoryItem } from "@personal-character-agent/shared";

export interface MemoryStore {
  addMemory(
    input: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">
  ): Promise<MemoryItem>;
  listMemories(): Promise<MemoryItem[]>;
  searchMemories(query: string): Promise<MemoryItem[]>;
  updateMemory(
    id: string,
    patch: Partial<Omit<MemoryItem, "id" | "createdAt">>
  ): Promise<MemoryItem>;
  deleteMemory(id: string): Promise<void>;
  clearMemories(): Promise<void>;
  exportMemories(): Promise<MemoryItem[]>;
  deleteAllMemories(): Promise<void>;
}

export interface MemoryPersistenceAdapter {
  load(): Promise<MemoryItem[]>;
  save(items: MemoryItem[]): Promise<void>;
}
