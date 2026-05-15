import { describe, expect, it } from "vitest";
import {
  MockTTSProvider,
  VoiceEventBus,
  VoiceRuntime,
  splitTextForSpeech,
  voicePresets
} from "./index";

describe("Voice Runtime", () => {
  it("chunks text into speech-sized units", () => {
    const chunks = splitTextForSpeech("Hello there. This is a second sentence for the companion voice.", 24);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("emits mock TTS events for mouth animation sync", async () => {
    const bus = new VoiceEventBus();
    const runtime = new VoiceRuntime({
      eventBus: bus,
      profile: { ...voicePresets[2]!, provider: "mock" },
      providers: [new MockTTSProvider()]
    });

    const result = await runtime.speak("Testing the stage voice.");

    expect(result.ok).toBe(true);
    expect(result.audible).toBe(false);
    expect(bus.listEvents().some((event) => event.status === "viseme")).toBe(true);
  });
});
