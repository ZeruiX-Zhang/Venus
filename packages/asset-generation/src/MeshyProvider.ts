import { getDefaultAvatarManifest, type AvatarManifest } from "@personal-character-agent/avatar-model";
import type { AssetGenerationConfig, AssetProviderTestResult } from "./AssetGenerationConfig";
import type { AssetGenerationProvider } from "./AssetGenerationProvider";
import type { AssetGenerationInput, AssetGenerationJob, AssetGenerationKind, GeneratedAsset } from "./AssetGenerationJob";

const nowIso = (): string => new Date().toISOString();

export class MeshyProvider implements AssetGenerationProvider {
  readonly id = "meshy";
  readonly label = "Meshy";

  constructor(private readonly config: AssetGenerationConfig) {}

  async generateConceptImage(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createUnsupportedJob("concept-image", input);
  }

  async generateTurnaroundSheet(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createUnsupportedJob("turnaround-sheet", input);
  }

  async generateTextureVariation(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createUnsupportedJob("texture-variation", input);
  }

  async generateImageTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createPlannedJob("image-to-3d", input);
  }

  async generateTextTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createPlannedJob("text-to-3d", input);
  }

  async getJobStatus(jobId: string): Promise<AssetGenerationJob> {
    return this.createPlannedJob("text-to-3d", { prompt: `External Meshy polling is not configured for ${jobId}.` });
  }

  async importGeneratedAsset(asset: GeneratedAsset): Promise<AvatarManifest> {
    return asset.manifest ?? getDefaultAvatarManifest();
  }

  async testConnection(): Promise<AssetProviderTestResult> {
    return {
      ok: Boolean(this.config.apiKey && this.config.baseUrl),
      provider: "meshy",
      message: this.config.apiKey
        ? "Meshy configuration is present. Real request execution is intentionally deferred."
        : "Meshy API key is required for real 3D draft jobs.",
      latencyMs: 1
    };
  }

  private createPlannedJob(kind: AssetGenerationKind, input: AssetGenerationInput): AssetGenerationJob {
    const timestamp = nowIso();
    return {
      id: `meshy_planned_${kind}`,
      provider: "meshy",
      kind,
      status: "failed",
      progress: 0,
      input,
      assets: [],
      costEstimateUsd: 0,
      message: "MeshyProvider adapter is present for future image-to-3D and text-to-3D draft jobs. Add API execution before use.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  private createUnsupportedJob(kind: AssetGenerationKind, input: AssetGenerationInput): AssetGenerationJob {
    const timestamp = nowIso();
    return {
      id: `meshy_unsupported_${kind}`,
      provider: "meshy",
      kind,
      status: "failed",
      progress: 0,
      input,
      assets: [],
      costEstimateUsd: 0,
      message: "Meshy is reserved for 3D draft generation in this architecture.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }
}
