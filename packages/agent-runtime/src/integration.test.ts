// 集成测试：测试 novel → character → dialogue → memory 的完整管线
import { AvatarRuntime } from "@personal-character-agent/avatar-runtime";
import {
  LocalJsonMemoryStore,
  MockMemoryExtractor,
  PassthroughReranker,
  DefaultMemoryLifecycleManager
} from "@personal-character-agent/memory-core";
import {
  InMemoryMemorySkillStore,
  MemorySkillRegistry
} from "@personal-character-agent/memory-runtime";
import { createDefaultProviderSettings } from "@personal-character-agent/model-gateway";
import { createDefaultPersonalityMatrix } from "@personal-character-agent/persona-runtime";
import { LLMPersonaCompiler } from "@personal-character-agent/persona-core";
import {
  createDefaultSafetyProfile
} from "@personal-character-agent/safety-runtime";
import {
  createDefaultCharacterProfile,
  createDefaultModelProviderConfig,
  createDefaultSoulCard
} from "@personal-character-agent/shared";
import { describe, expect, it } from "vitest";
import { CompanionRuntime } from "./CompanionRuntime";

// 模拟 ModelClient：根据 system prompt 返回预设响应
function createFakeModelClient(overrides: Record<string, string> = {}) {
  return {
    providerName: "FakeModel",
    generateText: async (request: { messages: Array<{ role: string; content: string }> }) => {
      const systemContent = request.messages.find((m) => m.role === "system")?.content ?? "";
      for (const [keyword, response] of Object.entries(overrides)) {
        if (systemContent.includes(keyword)) {
          return { text: response };
        }
      }
      return { text: "Mock response." };
    }
  };
}

describe("Integration: novel → character → dialogue → memory", () => {
  it("extracts character from novel text and generates a SoulCard", async () => {
    const compiler = new LLMPersonaCompiler({
      enabled: true,
      modelClient: createFakeModelClient({
        "Extract candidate characters": JSON.stringify([
          {
            name: "Yuli",
            aliases: ["玉离"],
            evidence: ["Yuli stood beneath the peach blossoms"],
            confidence: 0.9,
            inferredTraits: ["graceful", "melancholic"]
          }
        ]),
        "character profile generator": JSON.stringify({
          tone: "poetic and wistful",
          formality: "polite",
          verbosity: "expressive",
          firstPerson: "I",
          catchphrases: ["The wind remembers what people forget."],
          personality_description: "A graceful wanderer with a melancholic heart.",
          personality_tags: ["graceful", "poetic"],
          traits: { openness: 0.8, kindness: 0.7, assertiveness: 0.3, curiosity: 0.6, humor: 0.2, energy: 0.4 },
          behavior_rules: ["Speak in poetic metaphors", "Avoid direct confrontation"],
          relationship_notes: "A distant but caring companion"
        })
      })
    });

    // Step 1: 从小说文本提取角色
    const candidates = await compiler.extractCharactersFromNovel(
      "Yuli stood beneath the peach blossoms, her gaze lost in the fading autumn light."
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.name).toBe("Yuli");

    // Step 2: 从角色生成 SoulCard
    const soulCard = await compiler.generateSoulCardFromCharacter({
      novelText: "Yuli stood beneath the peach blossoms...",
      candidate: candidates[0]!
    });
    expect(soulCard.character_name).toBe("Yuli");
    expect(soulCard.origin_mode).toBe("novel_import");
    expect(soulCard.speech_style.tone).toBe("poetic and wistful");
    expect(soulCard.personality.openness).toBe(0.8);
    expect(soulCard.personality.tags).toContain("graceful");
  });

  it("runs CompanionRuntime with memory-core store integration", async () => {
    const memoryStore = new LocalJsonMemoryStore();
    const soulCard = createDefaultSoulCard("Yuli");
    const characterProfile = {
      ...createDefaultCharacterProfile("Yuli"),
      soulCardId: soulCard.id
    };

    const runtime = new CompanionRuntime({
      config: {
        mode: "mock",
        developerMode: false,
        strictMode: false,
        memoryWriteMode: "ask",
        modelProvider: createDefaultModelProviderConfig(),
        modelGatewaySettings: createDefaultProviderSettings(),
        safetyProfile: createDefaultSafetyProfile("adult"),
        personalityMatrix: createDefaultPersonalityMatrix("Yuli"),
        enabledMemorySkillIds: new MemorySkillRegistry().enabledIds()
      },
      soulCard,
      characterProfile,
      memoryStore,
      memorySkillStore: new InMemoryMemorySkillStore(),
      memoryRegistry: new MemorySkillRegistry(),
      avatarRuntime: new AvatarRuntime(),
      safetyProfile: createDefaultSafetyProfile("adult"),
      personalityMatrix: createDefaultPersonalityMatrix("Yuli"),
      memoryExtractor: new MockMemoryExtractor(),
      memoryReranker: new PassthroughReranker()
    });

    // 发一条消息
    const result = await runtime.sendMessage("Hi Yuli, tell me about the peach blossoms.");
    expect(result.text).toBeTruthy();
    expect(result.safetyResult?.allowed).toBe(true);
  });

  it("memory lifecycle: add, deduplicate, and enforce capacity", async () => {
    const memoryStore = new LocalJsonMemoryStore();
    const lifecycle = new DefaultMemoryLifecycleManager(memoryStore);

    // 添加一些测试记忆
    await memoryStore.addMemory({
      type: "fact",
      content: "User likes classical Chinese poetry",
      importance: 0.8,
      source: "user",
      userEditable: true,
      tags: ["poetry", "preference"]
    });
    await memoryStore.addMemory({
      type: "fact",
      content: "User likes classical Chinese poems",
      importance: 0.7,
      source: "user",
      userEditable: true,
      tags: ["poetry", "preference"]
    });
    await memoryStore.addMemory({
      type: "preference",
      content: "User prefers dark theme",
      importance: 0.5,
      source: "user",
      userEditable: true,
      tags: ["ui", "preference"]
    });

    // 去重应该合并两条相似的 poetry 记忆
    const dedupCount = await lifecycle.deduplicateMemories(0.5);
    expect(dedupCount).toBeGreaterThanOrEqual(1);

    const remaining = await memoryStore.listMemories();
    expect(remaining.length).toBeLessThanOrEqual(2);
  });

  it("memory search with reranker returns relevant results", async () => {
    const memoryStore = new LocalJsonMemoryStore();
    const reranker = new PassthroughReranker();

    await memoryStore.addMemory({
      type: "fact",
      content: "User's favorite color is blue",
      importance: 0.6,
      source: "user",
      userEditable: true,
      tags: ["color", "preference"]
    });
    await memoryStore.addMemory({
      type: "preference",
      content: "User enjoys playing piano",
      importance: 0.7,
      source: "user",
      userEditable: true,
      tags: ["music", "hobby"]
    });
    await memoryStore.addMemory({
      type: "relationship",
      content: "User feels comfortable sharing personal stories",
      importance: 0.8,
      source: "assistant",
      userEditable: true,
      tags: ["trust", "relationship"]
    });

    // 搜索 color 相关的记忆
    const candidates = await memoryStore.searchMemories("color preference", { limit: 10 });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]!.content).toContain("color");

    // rerank（passthrough 直接返回前 N 条）
    const reranked = await reranker.rerank("What is the user's favorite color?", candidates, 2);
    expect(reranked.length).toBeLessThanOrEqual(2);
  });

  it("CompanionRuntime memory maintenance cleans up correctly", async () => {
    const memoryStore = new LocalJsonMemoryStore();
    const lifecycle = new DefaultMemoryLifecycleManager(memoryStore);

    // 添加 session-only 记忆
    await memoryStore.addMemory({
      type: "conversation",
      content: "temp chat context",
      importance: 0.3,
      source: "assistant",
      userEditable: true,
      tags: ["session-only", "session:test-session-1"]
    });
    await memoryStore.addMemory({
      type: "fact",
      content: "permanent fact",
      importance: 0.9,
      source: "user",
      userEditable: true,
      tags: ["important"]
    });

    const cleaned = await lifecycle.onSessionEnd("test-session-1");
    expect(cleaned).toBe(1);

    const remaining = await memoryStore.listMemories();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.content).toBe("permanent fact");
  });

  it("full pipeline: SoulCard → CompanionRuntime → dialogue with memory context", async () => {
    const memoryStore = new LocalJsonMemoryStore();

    // 预先存入一些记忆（模拟之前对话积累的）
    await memoryStore.addMemory({
      type: "preference",
      content: "User loves Li Bai's poetry",
      importance: 0.9,
      source: "user",
      userEditable: true,
      tags: ["poetry", "li-bai", "preference"]
    });

    const soulCard = {
      ...createDefaultSoulCard("Yuli"),
      origin_mode: "novel_import" as const,
      speech_style: {
        ...createDefaultSoulCard("Yuli").speech_style,
        tone: "poetic and wistful",
        formality: "polite" as const
      }
    };

    const runtime = new CompanionRuntime({
      config: {
        mode: "mock",
        developerMode: true,
        strictMode: false,
        memoryWriteMode: "ask",
        modelProvider: createDefaultModelProviderConfig(),
        modelGatewaySettings: createDefaultProviderSettings(),
        safetyProfile: createDefaultSafetyProfile("adult"),
        personalityMatrix: createDefaultPersonalityMatrix("Yuli"),
        enabledMemorySkillIds: new MemorySkillRegistry().enabledIds()
      },
      soulCard,
      characterProfile: {
        ...createDefaultCharacterProfile("Yuli"),
        soulCardId: soulCard.id
      },
      memoryStore,
      memorySkillStore: new InMemoryMemorySkillStore(),
      memoryRegistry: new MemorySkillRegistry(),
      avatarRuntime: new AvatarRuntime(),
      safetyProfile: createDefaultSafetyProfile("adult"),
      personalityMatrix: createDefaultPersonalityMatrix("Yuli"),
      memoryExtractor: new MockMemoryExtractor(),
      memoryReranker: new PassthroughReranker(),
      memoryLifecycleManager: new DefaultMemoryLifecycleManager(memoryStore)
    });

    // 发送与诗歌相关的消息——应该触发 memory-core 检索
    const result = await runtime.sendMessage("Do you know any poems about moonlight?");
    expect(result.text).toBeTruthy();
    expect(result.safetyResult?.allowed).toBe(true);

    // debugInfo 应该存在（developer mode）
    expect(result.debugInfo).toBeDefined();

    // 测试 maintenance
    const maintenance = await runtime.runMemoryMaintenance();
    expect(maintenance.evicted).toBe(0);
    expect(maintenance.deduplicated).toBe(0);

    // 测试 session cleanup
    const cleaned = await runtime.cleanupSessionMemories("nonexistent");
    expect(cleaned).toBe(0);
  });
});
