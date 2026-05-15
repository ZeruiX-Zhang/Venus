import { MockTTSProvider } from "./MockTTSProvider";
import {
  createVoiceEvent,
  type SpeakRequest,
  type TTSProvider
} from "./TTSProvider";
import type { VoiceEventBus } from "./VoiceEventBus";
import type { VoicePlaybackEvent, VoicePlaybackResult } from "./VoiceProfile";

export class BrowserSpeechTTSProvider implements TTSProvider {
  readonly kind = "browser_speech" as const;

  isAvailable(): boolean {
    return typeof globalThis.speechSynthesis !== "undefined" &&
      typeof globalThis.SpeechSynthesisUtterance !== "undefined";
  }

  async speak(
    request: SpeakRequest,
    bus: VoiceEventBus
  ): Promise<VoicePlaybackResult> {
    if (!this.isAvailable()) {
      const mock = new MockTTSProvider();
      const result = await mock.speak(
        { ...request, profile: { ...request.profile, provider: "mock" } },
        bus
      );
      return {
        ...result,
        provider: this.kind,
        message: "Browser speech synthesis is unavailable; mock voice sync ran instead."
      };
    }

    const events: VoicePlaybackEvent[] = [];
    const publish = (event: VoicePlaybackEvent) => {
      events.push(event);
      bus.publish(event);
    };
    publish(createVoiceEvent("queued", this.kind, { message: request.profile.displayName }));

    for (const [chunkIndex, chunk] of request.chunks.entries()) {
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.pitch = request.profile.pitch;
        utterance.rate = request.profile.rate;
        utterance.volume = request.profile.volume;
        utterance.onstart = () => {
          publish(createVoiceEvent("chunk_start", this.kind, { chunkIndex, chunkText: chunk }));
          publish(createVoiceEvent("viseme", this.kind, { chunkIndex, mouthOpen: 0.75 }));
        };
        utterance.onboundary = () => {
          publish(createVoiceEvent("viseme", this.kind, { chunkIndex, mouthOpen: 0.45 + Math.random() * 0.45 }));
        };
        utterance.onend = () => {
          publish(createVoiceEvent("chunk_end", this.kind, { chunkIndex, chunkText: chunk }));
          resolve();
        };
        utterance.onerror = (event) => {
          publish(createVoiceEvent("error", this.kind, { chunkIndex, message: event.error }));
          resolve();
        };
        globalThis.speechSynthesis.speak(utterance);
      });
    }

    publish(createVoiceEvent("complete", this.kind, { message: "Browser speech finished." }));
    return {
      ok: true,
      provider: this.kind,
      chunks: [...request.chunks],
      events,
      audible: true,
      message: "Browser speech synthesis played through the local browser."
    };
  }

  stop(): void {
    if (this.isAvailable()) {
      globalThis.speechSynthesis.cancel();
    }
  }
}
