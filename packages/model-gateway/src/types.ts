export type ModelGatewayMode = "mock" | "cloud" | "local";
export type ModelProviderPresetId =
  | "gpt-openai-compatible"
  | "openai-compatible"
  | "claude"
  | "deepseek"
  | "minimax";

export interface ModelProviderSettings {
  mode: ModelGatewayMode;
  presetId?: ModelProviderPresetId;
  providerName: string;
  baseUrl: string;
  apiKeyRef?: string;
  apiKey?: string;
  model: string;
  chatModel?: string;
  voiceModel?: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  capabilities?: ModelCapabilityFlags;
}

export interface ModelProviderPreset {
  id: ModelProviderPresetId;
  label: string;
  providerName: string;
  baseUrl: string;
  chatModel: string;
  voiceModel: string;
  capabilities: ModelCapabilityFlags;
}

export interface ModelCapabilityFlags {
  streaming: boolean;
  tools: boolean;
  vision: boolean;
  jsonMode: boolean;
  tts: boolean;
}

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateRequest {
  messages: GatewayMessage[];
  settings: ModelProviderSettings;
  metadata?: Record<string, string | number | boolean>;
}

export interface GenerateResult {
  text: string;
  providerName: string;
  model: string;
  mock: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ProviderTestResult {
  ok: boolean;
  message: string;
  providerName: string;
  model: string;
  mode: ModelGatewayMode;
  latencyMs: number;
  statusCode?: number;
  streamingChecked: boolean;
  streamingOk?: boolean;
  capabilities: ModelCapabilityFlags;
  error?: string;
  testedAt: string;
}

export interface ModelGateway {
  generate(request: GenerateRequest): Promise<GenerateResult>;
  testProvider(settings: ModelProviderSettings): Promise<ProviderTestResult>;
}
export type { SecretStore, StoredSecretMetadata } from "./secrets/SecretStore";
