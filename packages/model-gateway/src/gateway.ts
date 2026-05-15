import { InMemorySecretStore } from "./secrets";
import { createProviderPresetSettings } from "./presets";
import type {
  GenerateRequest,
  GenerateResult,
  ModelCapabilityFlags,
  ModelGateway,
  ModelProviderSettings,
  ProviderTestResult,
  SecretStore
} from "./types";

const approximateTokens = (text: string): number => Math.ceil(text.length / 4);

export class MockModelGateway implements ModelGateway {
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const user = [...request.messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const system = request.messages.find((message) => message.role === "system")?.content ?? "";
    const memoryCount = (system.match(/\[profile\.|\[relationship\.|\[work\.|\[persona\.|\[journal\./g) ?? []).length;
    const safe = /Safety mode: minor|minor_safe_core/i.test(system);
    const responseLanguage = request.metadata?.responseLanguage === "zh" ? "zh" : "en";
    const unsafe = /\b(sexy|explicit|gore|erotic)\b/i.test(user) || /色情|露骨|血腥|情色/u.test(user);
    const text = responseLanguage === "zh"
      ? safe && unsafe
        ? "Mira：我会把内容保持安全且不露骨。我们可以改成适龄冒险、学习休息，或更柔和的角色片段。"
        : `Mira：我在这里陪你。${memoryCount > 0 ? `我召回了 ${memoryCount} 个相关记忆技能。` : ""}${mockResponseTail(user, "zh")}`
      : safe && unsafe
        ? "Mira: I will keep this safe and non-explicit. We can turn it into an age-appropriate adventure, a study break, or a softer character moment."
        : `Mira: I am here with you.${memoryCount > 0 ? ` I recalled ${memoryCount} relevant memory ${memoryCount === 1 ? "skill" : "skills"}.` : ""} ${mockResponseTail(user, "en")}`;
    return {
      text,
      providerName: "mock",
      model: "deterministic-companion-v0.4",
      mock: true,
      usage: {
        inputTokens: approximateTokens(request.messages.map((message) => message.content).join("\n")),
        outputTokens: approximateTokens(text)
      }
    };
  }

  async testProvider(settings: ModelProviderSettings): Promise<ProviderTestResult> {
    return {
      ok: true,
      message: "Local demo gateway is available without an API key.",
      providerName: settings.providerName || "mock",
      model: settings.model,
      mode: "mock",
      latencyMs: 0,
      streamingChecked: false,
      capabilities: normalizeCapabilities(settings),
      testedAt: new Date().toISOString()
    };
  }
}

export class OpenAICompatibleGateway implements ModelGateway {
  constructor(private readonly secretStore: SecretStore = new InMemorySecretStore()) {}

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    if (request.settings.mode === "mock") {
      return new MockModelGateway().generate(request);
    }
    const apiKey = request.settings.apiKey ?? (request.settings.apiKeyRef ? await this.secretStore.getSecret(request.settings.apiKeyRef) : undefined);
    if (!apiKey) {
      return new MockModelGateway().generate({
        ...request,
        settings: { ...request.settings, mode: "mock" }
      });
    }
    const baseUrl = request.settings.baseUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: request.settings.model,
        messages: request.messages,
        temperature: request.settings.temperature,
        max_tokens: request.settings.maxTokens,
        stream: false
      })
    });
    if (!response.ok) {
      throw new Error(`Provider request failed: ${response.status} ${response.statusText}`);
    }
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = json.choices?.[0]?.message?.content?.trim() || "Mira: I received an empty provider response.";
    return {
      text,
      providerName: request.settings.providerName,
      model: request.settings.model,
      mock: false,
      usage: {
        inputTokens: json.usage?.prompt_tokens ?? approximateTokens(request.messages.map((message) => message.content).join("\n")),
        outputTokens: json.usage?.completion_tokens ?? approximateTokens(text)
      }
    };
  }

  async testProvider(settings: ModelProviderSettings): Promise<ProviderTestResult> {
    const started = performance.now();
    if (settings.mode === "mock") {
      return new MockModelGateway().testProvider(settings);
    }
    const apiKey = settings.apiKey ?? (settings.apiKeyRef ? await this.secretStore.getSecret(settings.apiKeyRef) : undefined);
    if (!apiKey) {
      return {
        ok: false,
        message: "No API key configured. Mock mode remains available.",
        providerName: settings.providerName,
        model: settings.model,
        mode: settings.mode,
        latencyMs: Math.round(performance.now() - started),
        streamingChecked: false,
        capabilities: normalizeCapabilities(settings),
        error: "missing_api_key",
        testedAt: new Date().toISOString()
      };
    }
    const baseUrl = settings.baseUrl.replace(/\/$/, "");
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            {
              role: "user",
              content: "Reply with the single word ok for a provider health check."
            }
          ],
          temperature: 0,
          max_tokens: 8,
          stream: false
        })
      });
      const latencyMs = Math.round(performance.now() - started);
      if (!response.ok) {
        const text = await response.text();
        return {
          ok: false,
          message: `Provider request failed with HTTP ${response.status}.`,
          providerName: settings.providerName,
          model: settings.model,
          mode: settings.mode,
          latencyMs,
          statusCode: response.status,
          streamingChecked: false,
          capabilities: normalizeCapabilities(settings),
          error: text.slice(0, 600) || response.statusText,
          testedAt: new Date().toISOString()
        };
      }
      const json = (await response.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
      };
      const model = json.model ?? settings.model;
      const healthText = json.choices?.[0]?.message?.content?.trim();
      return {
        ok: true,
        message: `Provider responded successfully${healthText ? `: ${healthText.slice(0, 80)}` : "."}`,
        providerName: settings.providerName,
        model,
        mode: settings.mode,
        latencyMs,
        statusCode: response.status,
        streamingChecked: false,
        capabilities: normalizeCapabilities(settings),
        testedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        ok: false,
        message: "Provider request failed before a response was received.",
        providerName: settings.providerName,
        model: settings.model,
        mode: settings.mode,
        latencyMs: Math.round(performance.now() - started),
        streamingChecked: false,
        capabilities: normalizeCapabilities(settings),
        error: error instanceof Error ? error.message : String(error),
        testedAt: new Date().toISOString()
      };
    }
  }
}

export const createDefaultProviderSettings = (): ModelProviderSettings => ({
  ...createProviderPresetSettings("gpt-openai-compatible"),
  mode: "mock",
  providerName: "mock",
  model: "deterministic-companion-v0.4",
  chatModel: "deterministic-companion-v0.4",
  voiceModel: "deterministic-companion-voice-v0.4",
  temperature: 0.7,
  maxTokens: 700,
  streaming: false,
  capabilities: {
    streaming: false,
    tools: false,
    vision: false,
    jsonMode: true,
    tts: false
  }
});

export const createModelGateway = (
  settings: ModelProviderSettings,
  secretStore: SecretStore = new InMemorySecretStore()
): ModelGateway =>
  settings.mode === "mock" ? new MockModelGateway() : new OpenAICompatibleGateway(secretStore);

const mockResponseTail = (user: string, language: "zh" | "en"): string => {
  if (/\b(import|novel|persona)\b/i.test(user) || /导入|小说|人格|角色/u.test(user)) {
    if (language === "zh") {
      return "把文本粘贴到导入页，我可以生成可编辑的人格核心，并且不会保存来源长段落。";
    }
    return "Paste text in Import and I can turn it into editable persona cores without storing long source passages.";
  }
  if (/\b(memory|remember)\b/i.test(user) || /记忆|记住/u.test(user)) {
    if (language === "zh") {
      return "我会把记忆放入审批队列，不会静默保存。";
    }
    return "I queued memory review instead of saving silently.";
  }
  if (/\b(study|work|plan)\b/i.test(user) || /学习|工作|计划/u.test(user)) {
    if (language === "zh") {
      return "我们把它整理成一个清晰的下一步。";
    }
    return "Let us turn it into a clean next step.";
  }
  if (language === "zh") {
    return "告诉我接下来想做什么，我会保持在当前人格和安全边界内。";
  }
  return "Tell me what you want to do next, and I will stay grounded in the active persona.";
};

const normalizeCapabilities = (
  settings: ModelProviderSettings
): ModelCapabilityFlags => ({
  streaming: settings.capabilities?.streaming ?? settings.streaming,
  tools: settings.capabilities?.tools ?? false,
  vision: settings.capabilities?.vision ?? false,
  jsonMode: settings.capabilities?.jsonMode ?? true,
  tts: settings.capabilities?.tts ?? false
});
