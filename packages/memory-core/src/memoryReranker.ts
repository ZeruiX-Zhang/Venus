import type { MemoryItem } from "@personal-character-agent/shared";

export interface MemoryReranker {
  rerank(
    query: string,
    candidates: MemoryItem[],
    maxResults: number
  ): Promise<MemoryItem[]>;
}

interface MinimalModelClient {
  generateText(request: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
  }): Promise<{ text: string }>;
}

const RERANK_SYSTEM_PROMPT = `You are a memory relevance ranker. Given a user message and a list of memories, select the most relevant memories for this conversation.

Return ONLY a JSON array of memory indices (0-based), ordered by relevance (most relevant first). Example: [2, 0, 5]
Keep at most the number specified. If none are relevant, return [].`;

export class LlmMemoryReranker implements MemoryReranker {
  constructor(private readonly modelClient: MinimalModelClient) {}

  async rerank(
    query: string,
    candidates: MemoryItem[],
    maxResults: number
  ): Promise<MemoryItem[]> {
    if (candidates.length <= maxResults) return candidates;

    const candidateList = candidates
      .map((m, i) => `${i}. [${m.type}] ${m.content} (tags: ${m.tags.join(", ")})`)
      .join("\n");

    const response = await this.modelClient.generateText({
      messages: [
        { role: "system", content: RERANK_SYSTEM_PROMPT },
        {
          role: "user",
          content: `User message: ${query}\n\nMemories:\n${candidateList}\n\nSelect up to ${maxResults} most relevant indices.`
        }
      ],
      temperature: 0.1
    });

    const indices = this.parseIndices(response.text, candidates.length);
    return indices.slice(0, maxResults).map((i) => candidates[i]!);
  }

  private parseIndices(text: string, maxIndex: number): number[] {
    const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
    const match = /\[[\s\S]*?\]/.exec(cleaned);
    if (!match) return [];
    try {
      const parsed: unknown = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (v): v is number =>
          typeof v === "number" && Number.isInteger(v) && v >= 0 && v < maxIndex
      );
    } catch {
      return [];
    }
  }
}

// 不调 LLM，直接返回前 N 条
export class PassthroughReranker implements MemoryReranker {
  async rerank(
    _query: string,
    candidates: MemoryItem[],
    maxResults: number
  ): Promise<MemoryItem[]> {
    return candidates.slice(0, maxResults);
  }
}
