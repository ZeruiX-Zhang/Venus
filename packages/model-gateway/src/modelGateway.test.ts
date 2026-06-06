import { describe, expect, it } from "vitest";
import {
  createDefaultProviderSettings,
  createProviderPresetSettings,
  InMemorySecretStore,
  maskSecret,
  MockModelGateway,
  OpenAICompatibleGateway
} from "./index";

describe("Model Gateway", () => {
  it("generates mock responses without API keys", async () => {
    const gateway = new MockModelGateway();
    const result = await gateway.generate({
      settings: createDefaultProviderSettings(),
      messages: [
        { role: "system", content: "Safety mode: adult" },
        { role: "user", content: "hello" }
      ]
    });

    expect(result.mock).toBe(true);
    expect(result.text).toContain("Mira");
  });

  it("falls back to mock when an OpenAI-compatible provider has no key", async () => {
    const gateway = new OpenAICompatibleGateway(new InMemorySecretStore());
    const result = await gateway.generate({
      settings: createProviderPresetSettings("deepseek"),
      messages: [{ role: "user", content: "hello" }]
    });

    expect(result.mock).toBe(true);
  });

  it("creates provider presets with chat and voice model defaults", () => {
    expect(createProviderPresetSettings("gpt-openai-compatible")).toMatchObject({
      providerName: "OpenAI-compatible",
      model: "gpt-4o-mini",
      chatModel: "gpt-4o-mini",
      voiceModel: "gpt-4o-mini-tts"
    });
    expect(createProviderPresetSettings("claude")).toMatchObject({
      providerName: "Claude",
      model: "claude-3-5-haiku-latest",
      voiceModel: "companion-voice-fallback-v0.4"
    });
    expect(createProviderPresetSettings("deepseek")).toMatchObject({
      providerName: "DeepSeek",
      model: "deepseek-v4-flash",
      voiceModel: "companion-voice-fallback-v0.4"
    });
    expect(createProviderPresetSettings("minimax")).toMatchObject({
      providerName: "MiniMax",
      model: "MiniMax-Text-01",
      voiceModel: "speech-02-hd"
    });
  });

  it("masks and stores secrets through the secret store abstraction", async () => {
    const store = new InMemorySecretStore();
    const metadata = await store.setSecret("provider:demo", "sk-test-1234567890");

    expect(await store.getSecret("provider:demo")).toBe("sk-test-1234567890");
    expect(metadata.masked).toBe("sk-t...7890");
    expect(maskSecret("short")).toBe("s***t");
  });

  it("reports provider QA failures without throwing when no key is configured", async () => {
    const gateway = new OpenAICompatibleGateway(new InMemorySecretStore());
    const result = await gateway.testProvider({
      ...createDefaultProviderSettings(),
      mode: "cloud",
      providerName: "OpenAI-compatible"
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("missing_api_key");
    expect(result.capabilities.jsonMode).toBe(true);
  });
});
