import type { ModelProviderConfig } from "@personal-character-agent/shared";

export type ModelMessageRole = "system" | "user" | "assistant";

export interface ModelMessage {
  role: ModelMessageRole;
  content: string;
}

export interface ModelRequest {
  messages: ModelMessage[];
  temperature?: number;
  metadata?: Record<string, unknown>;
}

export interface ModelResponse {
  text: string;
  raw?: unknown;
  finishReason?: string;
}

export interface ModelClient {
  readonly providerName: string;
  generateText(request: ModelRequest): Promise<ModelResponse>;
  streamText?(request: ModelRequest): AsyncIterable<string>;
}

export interface OpenAICompatibleClientOptions {
  providerName?: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
}

interface OpenAICompatibleResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export class OpenAICompatibleModelClient implements ModelClient {
  readonly providerName: string;
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number | undefined;
  private readonly headers: Record<string, string>;

  constructor(options: OpenAICompatibleClientOptions) {
    this.providerName = options.providerName ?? "OpenAI-compatible";
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.temperature = options.temperature ?? 0.7;
    this.maxTokens = options.maxTokens;
    this.headers = options.headers ?? {};
  }

  static fromConfig(config: ModelProviderConfig): OpenAICompatibleModelClient {
    const options: OpenAICompatibleClientOptions = {
      providerName: config.providerName,
      baseUrl: config.baseUrl,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    };

    if (config.apiKey) {
      options.apiKey = config.apiKey;
    }

    return new OpenAICompatibleModelClient({
      ...options
    });
  }

  async generateText(request: ModelRequest): Promise<ModelResponse> {
    if (!this.apiKey) {
      throw new Error(
        `${this.providerName} requires an API key. Enable mock mode for local demos.`
      );
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
        ...this.headers
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? this.temperature,
        ...(this.maxTokens ? { max_tokens: this.maxTokens } : {})
      })
    });

    if (!response.ok) {
      throw new Error(
        `${this.providerName} request failed: ${response.status} ${response.statusText}`
      );
    }

    const raw = (await response.json()) as OpenAICompatibleResponse;
    const firstChoice = raw.choices?.[0];
    const text = firstChoice?.message?.content?.trim();
    if (!firstChoice || !text) {
      throw new Error(`${this.providerName} returned an empty response.`);
    }

    return {
      text,
      raw,
      ...(firstChoice.finish_reason
        ? { finishReason: firstChoice.finish_reason }
        : {})
    };
  }
}

export class MockModelClient implements ModelClient {
  readonly providerName = "MockModel";

  async generateText(request: ModelRequest): Promise<ModelResponse> {
    const userMessage =
      [...request.messages].reverse().find((message) => message.role === "user")
        ?.content ?? "";
    const systemMessage =
      request.messages.find((message) => message.role === "system")?.content ??
      "";
    const nameMatch = /Character:\s*(.+)/.exec(systemMessage);
    const characterName = nameMatch?.[1]?.split("\n")[0]?.trim() || "Mira";

    if (/remember\b/i.test(userMessage)) {
      return {
        text: `${characterName}: I saved that as a memory you can review or delete.`
      };
    }

    if (/\?/.test(userMessage)) {
      return {
        text: `${characterName}: My mock-mode answer is intentionally local. I can reason from the current SoulCard and visible memories, then a real provider can be plugged in later.`
      };
    }

    return {
      text: `${characterName}: I heard you. In mock mode, I keep the reply grounded in the current persona and avoid pretending to use a real model.`
    };
  }
}
