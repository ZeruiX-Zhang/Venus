import type { MemoryItem } from "@personal-character-agent/shared";
import { describe, expect, it } from "vitest";
import { LlmMemoryReranker, PassthroughReranker } from "./memoryReranker";

const makeMem = (id: string, content: string, tags: string[] = []): MemoryItem => ({
  id,
  type: "fact",
  content,
  importance: 0.5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  source: "user",
  userEditable: true,
  tags
});

function createFakeModelClient(responseText: string) {
  return {
    generateText: async () => ({ text: responseText })
  };
}

describe("LlmMemoryReranker", () => {
  it("reranks candidates based on LLM-returned indices", async () => {
    const candidates = [
      makeMem("1", "User likes cats"),
      makeMem("2", "User is an engineer"),
      makeMem("3", "User lives in Tokyo")
    ];

    const reranker = new LlmMemoryReranker(
      createFakeModelClient("[2, 0]")
    );
    const result = await reranker.rerank("where do you live?", candidates, 2);

    expect(result).toHaveLength(2);
    expect(result[0]!.content).toBe("User lives in Tokyo");
    expect(result[1]!.content).toBe("User likes cats");
  });

  it("returns all candidates when count <= maxResults", async () => {
    const candidates = [
      makeMem("1", "User likes cats"),
      makeMem("2", "User is an engineer")
    ];

    const reranker = new LlmMemoryReranker(
      createFakeModelClient("should not be called")
    );
    const result = await reranker.rerank("test", candidates, 5);

    expect(result).toHaveLength(2);
  });

  it("handles invalid LLM output gracefully", async () => {
    const candidates = [
      makeMem("1", "User likes cats"),
      makeMem("2", "User is an engineer"),
      makeMem("3", "User lives in Tokyo")
    ];

    const reranker = new LlmMemoryReranker(
      createFakeModelClient("I cannot determine relevance")
    );
    const result = await reranker.rerank("test", candidates, 2);

    expect(result).toEqual([]);
  });

  it("filters out out-of-range indices", async () => {
    const candidates = [
      makeMem("1", "A"),
      makeMem("2", "B")
    ];

    const reranker = new LlmMemoryReranker(
      createFakeModelClient("[0, 5, -1, 1]")
    );
    const result = await reranker.rerank("test", candidates, 4);

    expect(result).toHaveLength(2);
    expect(result[0]!.content).toBe("A");
    expect(result[1]!.content).toBe("B");
  });
});

describe("PassthroughReranker", () => {
  it("returns first N candidates without reranking", async () => {
    const candidates = [
      makeMem("1", "A"),
      makeMem("2", "B"),
      makeMem("3", "C")
    ];

    const reranker = new PassthroughReranker();
    const result = await reranker.rerank("test", candidates, 2);

    expect(result).toHaveLength(2);
    expect(result[0]!.content).toBe("A");
  });
});
