import { AvatarEventBus } from "@personal-character-agent/avatar-core/events";
import { LocalJsonMemoryStore } from "@personal-character-agent/memory-core";
import {
  createDefaultCharacterProfile,
  createDefaultSoulCard
} from "@personal-character-agent/shared";
import { describe, expect, it } from "vitest";
import { AgentRuntime } from "./agentRuntime";
import { MockModelClient } from "./modelClient";
import { createDefaultToolRegistry } from "./toolRegistry";

describe("AgentRuntime", () => {
  it("responds with MockModelClient and emits avatar events", async () => {
    const avatarEventBus = new AvatarEventBus();
    const observedStates: string[] = [];
    avatarEventBus.subscribe((event) => observedStates.push(event.state));

    const runtime = new AgentRuntime({
      soulCard: createDefaultSoulCard("Nia"),
      characterProfile: createDefaultCharacterProfile("Nia"),
      memoryStore: new LocalJsonMemoryStore(),
      modelClient: new MockModelClient(),
      toolRegistry: createDefaultToolRegistry(),
      avatarEventBus
    });

    const result = await runtime.sendMessage(
      "Please remember that I like black coffee."
    );

    expect(result.assistantText).toContain("Nia");
    expect(result.savedMemory?.content).toBe("I like black coffee.");
    expect(observedStates).toEqual(["thinking", "speaking", "happy"]);
  });
});
