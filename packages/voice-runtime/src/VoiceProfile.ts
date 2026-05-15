export type VoiceProviderKind = "mock" | "browser_speech";

export type VoiceEmotionStyle =
  | "neutral"
  | "warm"
  | "bright"
  | "soft"
  | "serious";

export interface VoiceProfile {
  id: string;
  displayName: string;
  provider: VoiceProviderKind;
  voiceId: string;
  pitch: number;
  rate: number;
  volume: number;
  emotionalStyle: VoiceEmotionStyle;
  enabled: boolean;
}

export interface VoicePreset extends VoiceProfile {
  description: string;
}

export type VoicePlaybackStatus =
  | "queued"
  | "chunk_start"
  | "viseme"
  | "chunk_end"
  | "complete"
  | "error";

export interface VoicePlaybackEvent {
  id: string;
  status: VoicePlaybackStatus;
  timestamp: string;
  provider: VoiceProviderKind;
  chunkIndex?: number;
  chunkText?: string;
  mouthOpen?: number;
  message?: string;
}

export interface VoicePlaybackResult {
  ok: boolean;
  provider: VoiceProviderKind;
  chunks: string[];
  events: VoicePlaybackEvent[];
  audible: boolean;
  message: string;
}
