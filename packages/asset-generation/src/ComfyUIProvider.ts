import { getDefaultAvatarManifest, type AvatarManifest } from "@personal-character-agent/avatar-model";
import type { AssetGenerationConfig, AssetProviderTestResult } from "./AssetGenerationConfig";
import type { AssetGenerationProvider } from "./AssetGenerationProvider";
import type { AssetGenerationInput, AssetGenerationJob, AssetGenerationKind, GeneratedAsset } from "./AssetGenerationJob";

const nowIso = (): string => new Date().toISOString();

export class ComfyUIProvider implements AssetGenerationProvider {
  readonly id = "comfyui";
  readonly label = "ComfyUI";

  constructor(private readonly config: AssetGenerationConfig) {}

  async generateConceptImage(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createPlannedJob("concept-image", input);
  }

  async generateTurnaroundSheet(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createPlannedJob("turnaround-sheet", input);
  }

  async generateTextureVariation(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createPlannedJob("texture-variation", input);
  }

  async generateImageTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createUnsupportedJob("image-to-3d", input);
  }

  async generateTextTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createUnsupportedJob("text-to-3d", input);
  }

  async getJobStatus(jobId: string): Promise<AssetGenerationJob> {
    return this.createUnsupportedJob("concept-image", { prompt: `External ComfyUI polling is not configured for ${jobId}.` });
  }

  async importGeneratedAsset(asset: GeneratedAsset): Promise<AvatarManifest> {
    return asset.manifest ?? getDefaultAvatarManifest();
  }

  async testConnection(): Promise<AssetProviderTestResult> {
    return {
      ok: Boolean(this.config.baseUrl),
      provider: "comfyui",
      message: this.config.baseUrl
        ? "ComfyUI configuration is present. Real workflow execution is intentionally deferred."
        : "ComfyUI base URL is required.",
      latencyMs: 1
    };
  }

  private createPlannedJob(kind: AssetGenerationKind, input: AssetGenerationInput): AssetGenerationJob {
    const timestamp = nowIso();
    return {
      id: `comfyui_planned_${kind}`,
      provider: "comfyui",
      kind,
      status: "failed",
      progress: 0,
      input,
      assets: [],
      costEstimateUsd: 0,
      message: "ComfyUIProvider adapter is present for future concept, turnaround, and texture workflows. Configure workflow execution before use.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  private createUnsupportedJob(kind: AssetGenerationKind, input: AssetGenerationInput): AssetGenerationJob {
    const timestamp = nowIso();
    return {
      id: `comfyui_unsupported_${kind}`,
      provider: "comfyui",
      kind,
      status: "failed",
      progress: 0,
      input,
      assets: [],
      costEstimateUsd: 0,
      message: "ComfyUI is reserved for image and texture generation, not 3D draft generation.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }
}
