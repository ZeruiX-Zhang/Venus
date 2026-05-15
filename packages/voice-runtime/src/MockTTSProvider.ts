import {
  createVoiceEvent,
  type SpeakRequest,
  type TTSProvider
} from "./TTSProvider";
import type { VoiceEventBus } from "./VoiceEventBus";
import type { VoicePlaybackEvent, VoicePlaybackResult } from "./VoiceProfile";

export class MockTTSProvider implements TTSProvider {
  readonly kind = "mock" as const;
  private stopped = false;

  isAvailable(): boolean {
    return true;
  }

  async speak(
    request: SpeakRequest,
    bus: VoiceEventBus
  ): Promise<VoicePlaybackResult> {
    this.stopped = false;
    const events: VoicePlaybackEvent[] = [];
    const publish = (event: VoicePlaybackEvent) => {
      events.push(event);
      bus.publish(event);
    };

    publish(createVoiceEvent("queued", this.kind, { message: request.profile.displayName }));
    request.chunks.forEach((chunk, chunkIndex) => {
      if (this.stopped) {
        return;
      }
      publish(createVoiceEvent("chunk_start", this.kind, { chunkIndex, chunkText: chunk }));
      for (let index = 0; index < Math.min(4, Math.max(1, Math.ceil(chunk.length / 42))); index += 1) {
        publish(
          createVoiceEvent("viseme", this.kind, {
            chunkIndex,
            mouthOpen: index % 2 === 0 ? 0.85 : 0.35
          })
        );
      }
      publish(createVoiceEvent("chunk_end", this.kind, { chunkIndex, chunkText: chunk }));
    });
    publish(createVoiceEvent("complete", this.kind, { message: "Mock voice sync complete." }));
    return {
      ok: true,
      provider: this.kind,
      chunks: [...request.chunks],
      events,
      audible: false,
      message: "Mock TTS emitted timing and mouth-shape events without audio."
    };
  }

  stop(): void {
    this.stopped = true;
  }
}
