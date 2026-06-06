import type { MemoryItem, MemoryType } from "@personal-character-agent/shared";

// LLM 返回的单条记忆结构
export interface ExtractedMemory {
  type: MemoryType;
  content: string;
  importance: number;
  tags: string[];
}

// 记忆提取器接口——方便测试时用 mock 替换
export interface MemoryExtractor {
  extract(
    userMessage: string,
    assistantReply: string,
    existingMemories: MemoryItem[]
  ): Promise<ExtractedMemory[]>;
}

// 任何支持 generateText 的 LLM 客户端
interface MinimalModelClient {
  generateText(request: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
  }): Promise<{ text: string }>;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a memory extractor for an AI companion. Analyze the conversation and extract facts worth remembering long-term.

Rules:
- Only extract factual information: user preferences, personal details, emotional states, relationship changes.
- Skip greetings, chitchat, and low-information content.
- Skip anything that duplicates an existing memory listed below.
- Assign importance: personal preference=0.6, important fact=0.8, emotional/relationship change=0.9
- Output a JSON array. If nothing worth remembering, return [].

Output format (strict JSON, no markdown):
[{"type":"preference|fact|relationship|conversation","content":"...","importance":0.6,"tags":["tag1","tag2"]}]`;

const VALID_TYPES = new Set<MemoryType>([
  "preference",
  "fact",
  "relationship",
  "conversation",
  "system_note"
]);

// 从 LLM 输出中提取 JSON 数组（兼容 markdown 包裹）
function parseJsonArray(text: string): unknown[] {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  const match = /\[[\s\S]*\]/.exec(cleaned);
  if (!match) return [];
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isValidExtractedMemory(item: unknown): item is ExtractedMemory {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.content === "string" &&
    obj.content.length > 0 &&
    typeof obj.importance === "number" &&
    obj.importance >= 0 &&
    obj.importance <= 1 &&
    VALID_TYPES.has(obj.type as MemoryType) &&
    Array.isArray(obj.tags) &&
    obj.tags.every((t: unknown) => typeof t === "string")
  );
}

export class LlmMemoryExtractor implements MemoryExtractor {
  constructor(private readonly modelClient: MinimalModelClient) {}

  async extract(
    userMessage: string,
    assistantReply: string,
    existingMemories: MemoryItem[]
  ): Promise<ExtractedMemory[]> {
    const existingSummary =
      existingMemories.length > 0
        ? existingMemories
            .slice(0, 20)
            .map((m) => `- [${m.type}] ${m.content}`)
            .join("\n")
        : "None";

    const response = await this.modelClient.generateText({
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `Existing memories:\n${existingSummary}`,
            `User said: ${userMessage}`,
            `Assistant replied: ${assistantReply}`
          ].join("\n\n")
        }
      ],
      temperature: 0.3
    });

    const raw = parseJsonArray(response.text);
    return raw.filter(isValidExtractedMemory);
  }
}

// 测试 / 离线时的 mock 实现
export class MockMemoryExtractor implements MemoryExtractor {
  async extract(): Promise<ExtractedMemory[]> {
    return [];
  }
}
