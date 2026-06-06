import type { MemoryItem } from "@personal-character-agent/shared";
import { describe, expect, it } from "vitest";
import { InMemoryPersistenceAdapter, LocalJsonMemoryStore } from "./localJsonMemoryStore";
import { DefaultMemoryLifecycleManager } from "./memoryLifecycle";

async function seedStore(
  store: LocalJsonMemoryStore,
  items: Array<Omit<MemoryItem, "id" | "createdAt" | "updatedAt">>
) {
  for (const item of items) {
    await store.addMemory(item);
  }
}

describe("DefaultMemoryLifecycleManager", () => {
  describe("onSessionEnd", () => {
    it("removes session-only memories for the given session", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "fact", content: "Persistent fact", importance: 0.8, source: "user", userEditable: true, tags: [] },
        { type: "conversation", content: "Session chat", importance: 0.3, source: "assistant", userEditable: true, tags: ["session-only", "session:abc"] },
        { type: "conversation", content: "Other session", importance: 0.3, source: "assistant", userEditable: true, tags: ["session-only", "session:xyz"] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const removed = await manager.onSessionEnd("abc");

      expect(removed).toBe(1);
      const remaining = await store.listMemories();
      expect(remaining).toHaveLength(2);
      expect(remaining.every((m) => m.content !== "Session chat")).toBe(true);
    });

    it("returns 0 when no session memories exist", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "fact", content: "A fact", importance: 0.5, source: "user", userEditable: true, tags: [] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const removed = await manager.onSessionEnd("nonexistent");

      expect(removed).toBe(0);
    });
  });

  describe("enforceCapacity", () => {
    it("evicts lowest-scored memories when over capacity", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "fact", content: "Important", importance: 0.9, source: "user", userEditable: true, tags: [] },
        { type: "fact", content: "Medium", importance: 0.5, source: "user", userEditable: true, tags: [] },
        { type: "fact", content: "Low value", importance: 0.1, source: "user", userEditable: true, tags: [] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const evicted = await manager.enforceCapacity(2);

      expect(evicted).toHaveLength(1);
      expect(evicted[0]!.content).toBe("Low value");
      const remaining = await store.listMemories();
      expect(remaining).toHaveLength(2);
    });

    it("does nothing when under capacity", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "fact", content: "A", importance: 0.5, source: "user", userEditable: true, tags: [] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const evicted = await manager.enforceCapacity(10);

      expect(evicted).toHaveLength(0);
    });
  });

  describe("deduplicateMemories", () => {
    it("merges similar memories of the same type", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "preference", content: "User likes black coffee very much", importance: 0.6, source: "user", userEditable: true, tags: ["coffee"] },
        { type: "preference", content: "User likes black coffee a lot", importance: 0.6, source: "assistant", userEditable: true, tags: ["coffee"] },
        { type: "fact", content: "Something unrelated", importance: 0.5, source: "user", userEditable: true, tags: [] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const merged = await manager.deduplicateMemories(0.5);

      expect(merged).toBe(1);
      const remaining = await store.listMemories();
      expect(remaining).toHaveLength(2);
    });

    it("does not merge memories of different types", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "preference", content: "User likes coffee", importance: 0.6, source: "user", userEditable: true, tags: [] },
        { type: "fact", content: "User likes coffee", importance: 0.8, source: "assistant", userEditable: true, tags: [] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const merged = await manager.deduplicateMemories(0.7);

      expect(merged).toBe(0);
    });

    it("returns 0 when no duplicates found", async () => {
      const store = new LocalJsonMemoryStore();
      await seedStore(store, [
        { type: "fact", content: "A completely unique fact", importance: 0.5, source: "user", userEditable: true, tags: [] },
        { type: "fact", content: "Something totally different here", importance: 0.5, source: "user", userEditable: true, tags: [] }
      ]);

      const manager = new DefaultMemoryLifecycleManager(store);
      const merged = await manager.deduplicateMemories(0.7);

      expect(merged).toBe(0);
    });
  });
});
