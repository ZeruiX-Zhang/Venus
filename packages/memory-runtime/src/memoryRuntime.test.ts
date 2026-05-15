import { describe, expect, it } from "vitest";
import {
  assembleMemoryContext,
  createMemoryWriteSuggestions,
  getMemorySkillDisplay,
  InMemoryMemorySkillStore,
  MemorySkillRegistry,
  retrieveMemoryPackets,
  saveMemory,
  selectMemorySkills
} from "./index";
import type { MemoryAgentState, MemoryRecord } from "./types";

const state: MemoryAgentState = {
  characterName: "Mira",
  activePersonaSummary: "Base persona is calm, observant, and useful.",
  userProfileSummary: "The user prefers concise help.",
  relationshipContract: "Warm companion boundaries with no dependency language.",
  safetyMode: "adult",
  currentScene: "Desktop stage chat.",
  developerMode: true
};

const record = (patch: Partial<MemoryRecord>): MemoryRecord => ({
  id: "m1",
  skillId: "user_preference_memory",
  namespace: "profile.preferences",
  content: "The user likes black coffee during morning planning.",
  source: "user",
  sourceMetadata: {},
  priority: "high",
  safetyTags: [],
  userEditable: true,
  approvalStatus: "approved",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...patch
});

describe("Memory Skill Registry", () => {
  it("provides Chinese display metadata while keeping internal English identifiers stable", () => {
    const registry = new MemorySkillRegistry();
    const skill = registry.get("user_preference_memory");
    const display = getMemorySkillDisplay(skill, "zh");

    expect(display.name).toBe("用户偏好记忆");
    expect(display.description).toContain("长期稳定");
    expect(skill.id).toBe("user_preference_memory");
    expect(skill.name).toBe("User preferences");
    expect(skill.namespace).toBe("profile.preferences");
  });

  it("selects only triggered skills plus always-on safety skill", () => {
    const selected = selectMemorySkills("I prefer quiet mornings", state);

    expect(selected.map((skill) => skill.id)).toContain("user_preference_memory");
    expect(selected.map((skill) => skill.id)).toContain("safety_memory");
    expect(selected.map((skill) => skill.id)).not.toContain("novel_lore_memory");
  });

  it("respects toggled skills", () => {
    const registry = new MemorySkillRegistry();
    registry.setEnabled("user_preference_memory", false);

    const selected = selectMemorySkills("I prefer quiet mornings", state, registry);

    expect(selected.map((skill) => skill.id)).not.toContain("user_preference_memory");
  });

  it("keeps display metadata edits out of recall selection and retrieval", async () => {
    const registry = new MemorySkillRegistry();
    registry.updateMetadata("user_preference_memory", {
      displayName: { zh: "自定义偏好", en: "Custom preferences" },
      displayDescription: { zh: "只改展示层。", en: "Display-only edit." },
      editable: false,
      userSelectable: false,
      correctionHints: ["Edited metadata should not affect matching."]
    });

    const skill = registry.get("user_preference_memory");
    const selected = selectMemorySkills("I prefer coffee planning", state, registry);
    const store = new InMemoryMemorySkillStore([record({})]);
    const packets = await retrieveMemoryPackets(
      selected,
      "I prefer coffee planning",
      { maxTotalTokens: 900 },
      store,
      state
    );

    expect(getMemorySkillDisplay(skill, "zh").name).toBe("自定义偏好");
    expect(selected.map((item) => item.id)).toContain("user_preference_memory");
    expect(packets.some((packet) => packet.content.includes("black coffee"))).toBe(true);

    registry.setEnabled("user_preference_memory", false);
    const disabledSelection = selectMemorySkills("I prefer coffee planning", state, registry);
    expect(disabledSelection.map((item) => item.id)).not.toContain("user_preference_memory");
  });
});

describe("Memory read pipeline", () => {
  it("pins always-on blocks before triggered retrieval", async () => {
    const store = new InMemoryMemorySkillStore([record({})]);
    const selected = selectMemorySkills("I prefer coffee planning", state);
    const packets = await retrieveMemoryPackets(
      selected,
      "I prefer coffee planning",
      { maxTotalTokens: 900 },
      store,
      state
    );

    expect(packets[0]?.coreBlockId).toBe("active_character_identity");
    expect(packets.some((packet) => packet.content.includes("black coffee"))).toBe(true);
  });

  it("keeps retrieval inside the memory budget", async () => {
    const store = new InMemoryMemorySkillStore([
      record({ id: "m1", content: "coffee ".repeat(200) }),
      record({ id: "m2", content: "coffee planning" })
    ]);
    const packets = await retrieveMemoryPackets(
      selectMemorySkills("coffee", state),
      "coffee",
      { maxTotalTokens: 220 },
      store,
      state
    );

    expect(packets.reduce((sum, packet) => sum + packet.tokenEstimate, 0)).toBeLessThanOrEqual(220);
  });

  it("assembles knowledge separately from persona memory", async () => {
    const store = new InMemoryMemorySkillStore([
      record({
        id: "k1",
        skillId: "knowledge_memory",
        namespace: "knowledge.external",
        content: "External note about the setting.",
        priority: "low"
      })
    ]);
    const packets = await retrieveMemoryPackets(
      selectMemorySkills("knowledge setting", state),
      "knowledge setting",
      { maxTotalTokens: 900 },
      store,
      state
    );

    expect(assembleMemoryContext(packets)).toContain("External knowledge context");
  });
});

describe("Memory write pipeline", () => {
  it("creates approval suggestions for explicit remember requests", async () => {
    const store = new InMemoryMemorySkillStore();
    const suggestions = await createMemoryWriteSuggestions(
      "Please remember that I prefer short answers.",
      "Mira: I drafted a memory suggestion.",
      state,
      store
    );

    expect(suggestions[0]?.approvalRequired).toBe(true);
    expect(suggestions[0]?.candidate.suggestedSkillId).toBe("user_preference_memory");
    expect(await store.listRecords()).toHaveLength(0);
  });

  it("detects conflicts and requires user review", async () => {
    const store = new InMemoryMemorySkillStore([record({ content: "The user prefers long detailed answers." })]);
    const suggestions = await createMemoryWriteSuggestions(
      "Please remember that I prefer short answers.",
      "Mira: queued.",
      state,
      store
    );

    expect(suggestions[0]?.conflict).toBe(true);
    expect(suggestions[0]?.status).toBe("conflict");
  });

  it("saves, exports, and deletes approved memories", async () => {
    const store = new InMemoryMemorySkillStore();
    const [suggestion] = await createMemoryWriteSuggestions(
      "Please remember that I like tea.",
      "Mira: queued.",
      state,
      store
    );
    if (!suggestion) {
      throw new Error("Expected suggestion");
    }

    await saveMemory(suggestion, store);
    expect(await store.exportRecords()).toHaveLength(1);

    await store.deleteAll();
    expect(await store.exportRecords()).toEqual([]);
  });

  it("supports Chinese memory triggers and approval copy while keeping skill IDs stable", async () => {
    const store = new InMemoryMemorySkillStore();
    const registry = new MemorySkillRegistry();
    const zhState: MemoryAgentState = {
      characterName: "Mira",
      activePersonaSummary: "中文人格核心",
      userProfileSummary: "",
      relationshipContract: "安全陪伴边界",
      safetyMode: "adult",
      currentScene: "中文舞台",
      developerMode: false,
      language: "zh"
    };

    const selected = selectMemorySkills("请记住我喜欢简洁回答。", zhState, registry);
    const suggestions = await createMemoryWriteSuggestions(
      "请记住我喜欢简洁回答。",
      "Mira：我会放入记忆建议。",
      zhState,
      store,
      registry
    );

    expect(selected.map((skill) => skill.id)).toContain("user_preference_memory");
    expect(suggestions[0]?.skill.id).toBe("user_preference_memory");
    expect(suggestions[0]?.userFacingMessage).toContain("批准");
  });
});
