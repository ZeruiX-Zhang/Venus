import type { MemoryItem } from "@personal-character-agent/shared";
import type { MemoryPersistenceAdapter, MemoryStore } from "./types";

const createId = (): string => {
  const cryptoWithUuid = globalThis.crypto as Crypto | undefined;
  return cryptoWithUuid?.randomUUID
    ? cryptoWithUuid.randomUUID()
    : `memory_${Math.random().toString(36).slice(2, 12)}`;
};

const nowIso = (): string => new Date().toISOString();

export class InMemoryPersistenceAdapter implements MemoryPersistenceAdapter {
  private items: MemoryItem[];

  constructor(initialItems: MemoryItem[] = []) {
    this.items = [...initialItems];
  }

  async load(): Promise<MemoryItem[]> {
    return [...this.items];
  }

  async save(items: MemoryItem[]): Promise<void> {
    this.items = [...items];
  }
}

export class BrowserLocalStorageMemoryAdapter
  implements MemoryPersistenceAdapter
{
  constructor(private readonly storageKey: string) {}

  async load(): Promise<MemoryItem[]> {
    if (typeof globalThis.localStorage === "undefined") {
      return [];
    }

    const raw = globalThis.localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as MemoryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async save(items: MemoryItem[]): Promise<void> {
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }

    globalThis.localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}

export class LocalJsonMemoryStore implements MemoryStore {
  private initialized = false;
  private items: MemoryItem[] = [];

  constructor(
    private readonly adapter: MemoryPersistenceAdapter =
      new InMemoryPersistenceAdapter()
  ) {}

  async addMemory(
    input: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">
  ): Promise<MemoryItem> {
    await this.ensureInitialized();
    const timestamp = nowIso();
    const item: MemoryItem = {
      ...input,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.items = [item, ...this.items];
    await this.persist();
    return item;
  }

  async listMemories(): Promise<MemoryItem[]> {
    await this.ensureInitialized();
    return [...this.items].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  async searchMemories(query: string): Promise<MemoryItem[]> {
    await this.ensureInitialized();
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.listMemories();
    }

    return this.items
      .filter((item) => {
        const haystack = `${item.type} ${item.content} ${item.tags.join(" ")}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => b.importance - a.importance);
  }

  async updateMemory(
    id: string,
    patch: Partial<Omit<MemoryItem, "id" | "createdAt">>
  ): Promise<MemoryItem> {
    await this.ensureInitialized();
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error(`Memory not found: ${id}`);
    }

    const existing = this.items[index];
    if (!existing) {
      throw new Error(`Memory not found: ${id}`);
    }

    const updated: MemoryItem = {
      ...existing,
      ...patch,
      updatedAt: nowIso()
    };
    this.items = [
      ...this.items.slice(0, index),
      updated,
      ...this.items.slice(index + 1)
    ];
    await this.persist();
    return updated;
  }

  async deleteMemory(id: string): Promise<void> {
    await this.ensureInitialized();
    this.items = this.items.filter((item) => item.id !== id);
    await this.persist();
  }

  async clearMemories(): Promise<void> {
    await this.deleteAllMemories();
  }

  async exportMemories(): Promise<MemoryItem[]> {
    await this.ensureInitialized();
    return this.items.map((item) => ({ ...item, tags: [...item.tags] }));
  }

  async deleteAllMemories(): Promise<void> {
    await this.ensureInitialized();
    this.items = [];
    await this.persist();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.items = await this.adapter.load();
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await this.adapter.save(this.items);
  }
}
