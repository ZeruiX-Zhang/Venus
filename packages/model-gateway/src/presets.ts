import type {
  ModelProviderPreset,
  ModelProviderPresetId,
  ModelProviderSettings
} from "./types";

const sharedTextCapabilities = {
  streaming: true,
  tools: true,
  vision: false,
  jsonMode: true,
  tts: false
};

const presetDefinitions: Record<Exclude<ModelProviderPresetId, "openai-compatible">, ModelProviderPreset> = {
  "gpt-openai-compatible": {
    id: "gpt-openai-compatible",
    label: "GPT / OpenAI-compatible",
    providerName: "OpenAI-compatible",
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4o-mini",
    voiceModel: "gpt-4o-mini-tts",
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
      jsonMode: true,
      tts: true
    }
  },
  claude: {
    id: "claude",
    label: "Claude",
    providerName: "Claude",
    baseUrl: "https://api.anthropic.com/v1",
    chatModel: "claude-3-5-haiku-latest",
    voiceModel: "companion-voice-fallback-v0.4",
    capabilities: sharedTextCapabilities
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    providerName: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    chatModel: "deepseek-chat",
    voiceModel: "companion-voice-fallback-v0.4",
    capabilities: sharedTextCapabilities
  },
  minimax: {
    id: "minimax",
    label: "MiniMax",
    providerName: "MiniMax",
    baseUrl: "https://api.minimax.io/v1",
    chatModel: "MiniMax-Text-01",
    voiceModel: "speech-02-hd",
    capabilities: {
      streaming: true,
      tools: false,
      vision: false,
      jsonMode: true,
      tts: true
    }
  }
};

const normalizePresetId = (presetId: ModelProviderPresetId): Exclude<ModelProviderPresetId, "openai-compatible"> =>
  presetId === "openai-compatible" ? "gpt-openai-compatible" : presetId;

export const providerPresets: ModelProviderPreset[] = Object.values(presetDefinitions);

export const getProviderPreset = (presetId: ModelProviderPresetId): ModelProviderPreset =>
  presetDefinitions[normalizePresetId(presetId)];

export const createProviderPresetSettings = (
  presetId: ModelProviderPresetId
): ModelProviderSettings => {
  const preset = getProviderPreset(presetId);
  return {
    mode: "cloud",
    presetId: preset.id,
    providerName: preset.providerName,
    baseUrl: preset.baseUrl,
    model: preset.chatModel,
    chatModel: preset.chatModel,
    voiceModel: preset.voiceModel,
    temperature: 0.7,
    maxTokens: 700,
    streaming: preset.capabilities.streaming,
    capabilities: { ...preset.capabilities }
  };
};
