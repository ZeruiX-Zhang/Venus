import { BrowserSpeechTTSProvider } from "./BrowserSpeechTTSProvider";
import { MockTTSProvider } from "./MockTTSProvider";
import {
  splitTextForSpeech,
  type TTSProvider
} from "./TTSProvider";
import { VoiceEventBus } from "./VoiceEventBus";
import {
  defaultVoicePreset,
  voicePresets
} from "./voicePresets";
import type {
  VoicePlaybackResult,
  VoicePreset,
  VoiceProfile,
  VoiceProviderKind
} from "./VoiceProfile";

export interface VoiceRuntimeOptions {
  profile?: VoiceProfile;
  eventBus?: VoiceEventBus;
  providers?: TTSProvider[];
}

export class VoiceRuntime {
  private profile: VoiceProfile;
  private readonly eventBus: VoiceEventBus;
  private readonly providers: Map<VoiceProviderKind, TTSProvider>;

  constructor(options: VoiceRuntimeOptions = {}) {
    this.profile = options.profile ?? defaultVoicePreset;
    this.eventBus = options.eventBus ?? new VoiceEventBus();
    this.providers = new Map(
      (options.providers ?? [new MockTTSProvider(), new BrowserSpeechTTSProvider()]).map(
        (provider) => [provider.kind, provider]
      )
    );
  }

  getProfile(): VoiceProfile {
    return { ...this.profile };
  }

  setProfile(profile: VoiceProfile): void {
    this.profile = { ...profile };
  }

  listPresets(): VoicePreset[] {
    return voicePresets.map((preset) => ({ ...preset }));
  }

  getEventBus(): VoiceEventBus {
    return this.eventBus;
  }

  previewChunks(text: string): string[] {
    return splitTextForSpeech(text);
  }

  providerAvailable(kind = this.profile.provider): boolean {
    return this.providers.get(kind)?.isAvailable() ?? false;
  }

  async speak(text: string): Promise<VoicePlaybackResult> {
    const chunks = splitTextForSpeech(text);
    if (!this.profile.enabled) {
      return {
        ok: true,
        provider: this.profile.provider,
        chunks,
        events: [],
        audible: false,
        message: "Voice is disabled; no playback was started."
      };
    }
    const provider = this.providers.get(this.profile.provider) ?? this.providers.get("mock");
    if (!provider) {
      return {
        ok: false,
        provider: this.profile.provider,
        chunks,
        events: [],
        audible: false,
        message: "No TTS provider is available."
      };
    }
    return provider.speak({ text, profile: this.profile, chunks }, this.eventBus);
  }

  stop(): void {
    for (const provider of this.providers.values()) {
      provider.stop();
    }
  }
}
