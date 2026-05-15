import type { VoicePreset } from "./VoiceProfile";

export const voicePresets: VoicePreset[] = [
  {
    id: "voice_celestial",
    displayName: "Celestial warm",
    description: "Bright, clear demo voice for the default companion.",
    provider: "browser_speech",
    voiceId: "browser-default",
    pitch: 1.12,
    rate: 1,
    volume: 0.9,
    emotionalStyle: "warm",
    enabled: true
  },
  {
    id: "voice_soft",
    displayName: "Soft focus",
    description: "Lower-energy voice for study and late-night mode.",
    provider: "browser_speech",
    voiceId: "browser-default",
    pitch: 0.96,
    rate: 0.88,
    volume: 0.82,
    emotionalStyle: "soft",
    enabled: true
  },
  {
    id: "voice_mock_stage",
    displayName: "Mock stage sync",
    description: "Silent provider that still emits mouth-shape and timing events.",
    provider: "mock",
    voiceId: "mock-viseme",
    pitch: 1,
    rate: 1,
    volume: 0,
    emotionalStyle: "bright",
    enabled: true
  }
];

export const defaultVoicePreset = voicePresets[0]!;
