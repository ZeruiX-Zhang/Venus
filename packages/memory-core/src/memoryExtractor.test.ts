import { describe, expect, it } from "vitest";
import { LlmMemoryExtractor, MockMemoryExtractor } from "./memoryExtractor";

// 模拟 LLM 客户端——返回预设的 JSON
function createFakeModelClient(responseText: string) {
  return {
    generateText: async () => ({ text: responseText })
  };
}

describe("LlmMemoryExtractor", () => {
  it("extracts valid memories from LLM JSON response", async () => {
    const llmResponse = JSON.stringify([
      {
        type: "preference",
        content: "User likes black coffee",
        importance: 0.6,
        tags: ["food", "coffee"]
      },
      {
        type: "fact",
        content: "User is an engineer",
        importance: 0.8,
        tags: ["career"]
      }
    ]);

    const extractor = new LlmMemoryExtractor(
      createFakeModelClient(llmResponse)
    );
    const result = await extractor.extract("I'm an engineer who loves coffee", "That's cool!", []);

    expect(result).toHaveLength(2);
    expect(result[0]!.type).toBe("preference");
    expect(result[0]!.content).toBe("User likes black coffee");
    expect(result[1]!.type).toBe("fact");
  });

  it("handles markdown-wrapped JSON from LLM", async () => {
    const llmResponse = '```json\n[{"type":"fact","content":"User has a cat","importance":0.7,"tags":["pet"]}]\n```';

    const extractor = new LlmMemoryExtractor(
      createFakeModelClient(llmResponse)
    );
    const result = await extractor.extract("I have a cat", "Cute!", []);

    expect(result).toHaveLength(1);
    expect(result[0]!.content).toBe("User has a cat");
  });

  it("returns empty array when LLM returns no memories", async () => {
    const extractor = new LlmMemoryExtractor(
      createFakeModelClient("[]")
    );
    const result = await extractor.extract("Hello", "Hi there!", []);

    expect(result).toEqual([]);
  });

  it("filters out invalid entries from LLM response", async () => {
    const llmResponse = JSON.stringify([
      { type: "preference", content: "Valid", importance: 0.6, tags: ["ok"] },
      { type: "invalid_type", content: "Bad type", importance: 0.5, tags: [] },
      { type: "fact", content: "", importance: 0.5, tags: [] },
      { type: "fact", content: "Missing importance" },
      "not an object"
    ]);

    const extractor = new LlmMemoryExtractor(
      createFakeModelClient(llmResponse)
    );
    const result = await extractor.extract("test", "test", []);

    expect(result).toHaveLength(1);
    expect(result[0]!.content).toBe("Valid");
  });

  it("handles malformed LLM output gracefully", async () => {
    const extractor = new LlmMemoryExtractor(
      createFakeModelClient("I don't know what to extract")
    );
    const result = await extractor.extract("test", "test", []);

    expect(result).toEqual([]);
  });
});

describe("MockMemoryExtractor", () => {
  it("always returns empty array", async () => {
    const extractor = new MockMemoryExtractor();
    const result = await extractor.extract("anything", "anything", []);

    expect(result).toEqual([]);
  });
});
