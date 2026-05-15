export const assetProviderIds = ["mock", "comfyui", "meshy", "tripo"] as const;
export type AssetGenerationProviderId = (typeof assetProviderIds)[number];

export interface AssetGenerationConfig {
  provider: AssetGenerationProviderId;
  apiKey?: string;
  baseUrl: string;
  modelVersion: string;
  costWarning: boolean;
}

export interface AssetProviderTestResult {
  ok: boolean;
  provider: AssetGenerationProviderId;
  message: string;
  latencyMs: number;
}

export const createDefaultAssetGenerationConfig = (): AssetGenerationConfig => ({
  provider: "mock",
  baseUrl: "mock://local-avatar-assets",
  modelVersion: "mock-guofeng-v1",
  costWarning: true
});
