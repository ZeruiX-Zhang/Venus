import { getDefaultAvatarManifest, type AvatarManifest } from "@personal-character-agent/avatar-model";
import type { AssetGenerationConfig, AssetProviderTestResult } from "./AssetGenerationConfig";
import type { AssetGenerationProvider } from "./AssetGenerationProvider";
import type { AssetGenerationInput, AssetGenerationJob, AssetGenerationKind, GeneratedAsset } from "./AssetGenerationJob";

const nowIso = (): string => new Date().toISOString();

export class TripoProvider implements AssetGenerationProvider {
  readonly id = "tripo";
  readonly label = "Tripo";

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
    return this.createPlannedJob("image-to-3d", { prompt: `External Tripo polling is not configured for ${jobId}.` });
  }

  async importGeneratedAsset(asset: GeneratedAsset): Promise<AvatarManifest> {
    return asset.manifest ?? getDefaultAvatarManifest();
  }

  async testConnection(): Promise<AssetProviderTestResult> {
    return {
      ok: Boolean(this.config.apiKey && this.config.baseUrl),
      provider: "tripo",
      message: this.config.apiKey
        ? "Tripo configuration is present. Real request execution is intentionally deferred."
        : "Tripo API key is required for real image-to-3D or multi-image-to-3D jobs.",
      latencyMs: 1
    };
  }

  private createPlannedJob(kind: AssetGenerationKind, input: AssetGenerationInput): AssetGenerationJob {
    const timestamp = nowIso();
    return {
      id: `tripo_planned_${kind}`,
      provider: "tripo",
      kind,
      status: "failed",
      progress: 0,
      input,
      assets: [],
      costEstimateUsd: 0,
      message: "TripoProvider adapter is present for future image-to-3D and multi-image-to-3D draft jobs. Add API execution before use.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  private createUnsupportedJob(kind: AssetGenerationKind, input: AssetGenerationInput): AssetGenerationJob {
    const timestamp = nowIso();
    return {
      id: `tripo_unsupported_${kind}`,
      provider: "tripo",
      kind,
      status: "failed",
      progress: 0,
      input,
      assets: [],
      costEstimateUsd: 0,
      message: "Tripo is reserved for 3D draft generation in this architecture.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }
}
