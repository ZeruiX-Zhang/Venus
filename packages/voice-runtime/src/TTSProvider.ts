import type {
  VoicePlaybackResult,
  VoiceProfile
} from "./VoiceProfile";
import type { VoiceEventBus } from "./VoiceEventBus";

export interface SpeakRequest {
  text: string;
  profile: VoiceProfile;
  chunks: string[];
}

export interface TTSProvider {
  readonly kind: VoiceProfile["provider"];
  isAvailable(): boolean;
  speak(request: SpeakRequest, bus: VoiceEventBus): Promise<VoicePlaybackResult>;
  stop(): void;
}

export const splitTextForSpeech = (
  text: string,
  maxChunkLength = 150
): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (`${current} ${sentence}`.trim().length > maxChunkLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks.length > 0 ? chunks : [normalized.slice(0, maxChunkLength)];
};

export const createVoiceEvent = (
  status: Parameters<VoiceEventBus["publish"]>[0]["status"],
  provider: VoiceProfile["provider"],
  patch: Omit<Parameters<VoiceEventBus["publish"]>[0], "id" | "status" | "timestamp" | "provider"> = {}
) => ({
  id: `voice_${Math.random().toString(36).slice(2, 10)}`,
  status,
  timestamp: new Date().toISOString(),
  provider,
  ...patch
});
