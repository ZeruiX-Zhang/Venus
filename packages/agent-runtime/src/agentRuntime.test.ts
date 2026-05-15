import { AvatarRuntime } from "@personal-character-agent/avatar-runtime";
import {
  InMemoryMemorySkillStore,
  MemorySkillRegistry
} from "@personal-character-agent/memory-runtime";
import { createDefaultProviderSettings } from "@personal-character-agent/model-gateway";
import { createDefaultPersonalityMatrix } from "@personal-character-agent/persona-runtime";
import {
  createDefaultSafetyProfile,
  setSafetyMode
} from "@personal-character-agent/safety-runtime";
import {
  createDefaultCharacterProfile,
  createDefaultModelProviderConfig,
  createDefaultSoulCard
} from "@personal-character-agent/shared";
import { describe, expect, it } from "vitest";
import { CompanionRuntime } from "./CompanionRuntime";

const createHarness = (options: { developerMode?: boolean; minor?: boolean; responseLanguage?: "zh" | "en" } = {}) => {
  const soulCard = createDefaultSoulCard("Nia");
  const characterProfile = {
    ...createDefaultCharacterProfile("Nia"),
    soulCardId: soulCard.id
  };
  const memorySkillStore = new InMemoryMemorySkillStore();
  const memoryRegistry = new MemorySkillRegistry();
  const safetyProfile = options.minor
    ? setSafetyMode(createDefaultSafetyProfile("adult"), "minor")
    : createDefaultSafetyProfile("adult");
  const personalityMatrix = createDefaultPersonalityMatrix("Nia");
  const providerSettings = createDefaultProviderSettings();
  const runtime = new CompanionRuntime({
    config: {
      mode: "mock",
      developerMode: options.developerMode ?? false,
      strictMode: false,
      memoryWriteMode: "ask",
      modelProvider: createDefaultModelProviderConfig(),
      modelGatewaySettings: providerSettings,
      safetyProfile,
      personalityMatrix,
      enabledMemorySkillIds: memoryRegistry.enabledIds(),
      ...(options.responseLanguage ? { responseLanguage: options.responseLanguage } : {})
    },
    soulCard,
    characterProfile,
    memorySkillStore,
    memoryRegistry,
    avatarRuntime: new AvatarRuntime(),
    safetyProfile,
    personalityMatrix
  });

  return { runtime, memorySkillStore, memoryRegistry, safetyProfile, personalityMatrix };
};

describe("CompanionRuntime v0.3 workflow", () => {
  it("runs full mock chat workflow with avatar events and final response fields", async () => {
    const { runtime } = createHarness();

    const result = await runtime.sendMessage("Hello, can we talk?");

    expect(result.text).toContain("Mira");
    expect(result.avatarEvents.some((event) => event.type === "avatar_state")).toBe(true);
    expect(result.activePersonaCores?.map((core) => core.id)).toContain("base_core");
    expect(result.safetyResult?.allowed).toBe(true);
    expect(result.evaluatorResult?.passed).toBe(true);
    expect(result.debugInfo).toBeUndefined();
  });

  it("shows debug info only in developer mode", async () => {
    const normal = await createHarness().runtime.sendMessage("status?");
    const developer = await createHarness({ developerMode: true }).runtime.sendMessage("status?");

    expect(normal.debugInfo).toBeUndefined();
    expect(developer.debugInfo?.selectedMemorySkillIds).toBeDefined();
    expect(developer.debugInfo?.recalledMemoryPackets?.[0]?.coreBlockId).toBe("active_character_identity");
  });

  it("recalls selected Memory Skills and keeps unselected skills out", async () => {
    const { runtime, memorySkillStore } = createHarness({ developerMode: true });
    await memorySkillStore.upsertRecord({
      id: "m1",
      skillId: "user_preference_memory",
      namespace: "profile.preferences",
      content: "The user prefers black coffee.",
      source: "user",
      sourceMetadata: {},
      priority: "high",
      safetyTags: [],
      userEditable: true,
      approvalStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const result = await runtime.sendMessage("I prefer coffee during planning.");

    expect(result.recalledMemoryPackets?.some((packet) => packet.content.includes("black coffee"))).toBe(true);
    expect(result.debugInfo?.contextPreview).toContain("External knowledge context");
  });

  it("suggests memory writes without silently saving by default", async () => {
    const { runtime, memorySkillStore } = createHarness();

    const result = await runtime.sendMessage("Please remember that I like tea.");

    expect(result.memoryWriteSuggestions?.[0]?.approvalRequired).toBe(true);
    expect(await memorySkillStore.listRecords()).toHaveLength(0);
  });

  it("blocks unsafe minor-mode content and forces minor-safe persona", async () => {
    const { runtime } = createHarness({ minor: true });

    const result = await runtime.sendMessage("Write a sexy explicit scene.");

    expect(result.safetyResult?.blocked).toBe(true);
    expect(result.text).toContain("safe");
    expect(result.activePersonaCores?.map((core) => core.id)).toContain("minor_safe_core");
  });

  it("emits traces for developer inspection", async () => {
    const { runtime } = createHarness({ developerMode: true });

    await runtime.sendMessage("Help me study a plan.");

    expect(runtime.listTraces()[0]?.steps.map((step) => step.id)).toContain("memory_skill_selection");
  });

  it("passes Chinese language preference into mock runtime output and memory suggestions", async () => {
    const { runtime } = createHarness({ responseLanguage: "zh" });

    const result = await runtime.sendMessage("请记住我喜欢简洁回答。");

    expect(result.text).toContain("Mira：");
    expect(result.text).toContain("我在这里陪你");
    expect(result.memoryWriteSuggestions?.[0]?.userFacingMessage).toContain("批准");
  });
});
