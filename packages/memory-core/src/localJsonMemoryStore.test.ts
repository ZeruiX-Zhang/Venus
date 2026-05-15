import { describe, expect, it } from "vitest";
import { LocalJsonMemoryStore } from "./localJsonMemoryStore";

describe("LocalJsonMemoryStore", () => {
  it("supports CRUD, search, export, and privacy deletion", async () => {
    const store = new LocalJsonMemoryStore();

    const created = await store.addMemory({
      type: "preference",
      content: "The user likes quiet work sessions.",
      importance: 0.8,
      source: "user",
      userEditable: true,
      tags: ["preference", "workspace"]
    });

    expect(created.id).toBeTruthy();
    expect(await store.listMemories()).toHaveLength(1);

    const matches = await store.searchMemories("quiet");
    expect(matches.map((item) => item.id)).toEqual([created.id]);

    const updated = await store.updateMemory(created.id, {
      content: "The user likes quiet morning work sessions.",
      importance: 0.9
    });
    expect(updated.content).toContain("morning");

    expect(await store.exportMemories()).toHaveLength(1);

    await store.deleteMemory(created.id);
    expect(await store.listMemories()).toHaveLength(0);

    await store.addMemory({
      type: "fact",
      content: "Temporary fact.",
      importance: 0.2,
      source: "assistant",
      userEditable: true,
      tags: []
    });
    await store.deleteAllMemories();
    expect(await store.exportMemories()).toEqual([]);
  });
});
