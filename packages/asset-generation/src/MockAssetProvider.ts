import {
  cloneAvatarManifest,
  getDefaultAvatarManifest,
  updateMaterialSlot,
  type AvatarManifest
} from "@personal-character-agent/avatar-model";
import type { AssetProviderTestResult } from "./AssetGenerationConfig";
import type { AssetGenerationProvider } from "./AssetGenerationProvider";
import type {
  AssetGenerationInput,
  AssetGenerationJob,
  AssetGenerationKind,
  GeneratedAsset
} from "./AssetGenerationJob";

const nowIso = (): string => new Date().toISOString();

const makeId = (prefix: string): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const mockPreview = (title: string, accent: string): string => {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960">`,
    `<rect width="720" height="960" fill="#111722"/>`,
    `<circle cx="360" cy="270" r="210" fill="${accent}" opacity="0.2"/>`,
    `<path d="M220 770 C250 520 285 410 360 410 C435 410 470 520 500 770 Z" fill="${accent}" opacity="0.78"/>`,
    `<ellipse cx="360" cy="305" rx="96" ry="112" fill="#f0d3c2"/>`,
    `<path d="M255 310 C270 170 450 170 465 310 C430 260 290 260 255 310 Z" fill="#211b1c"/>`,
    `<path d="M250 565 C310 500 410 500 470 565" stroke="#f7efe0" stroke-width="46" stroke-linecap="round" fill="none" opacity="0.86"/>`,
    `<text x="360" y="880" text-anchor="middle" font-family="Arial" font-size="34" fill="#f3f7ff">${title}</text>`,
    `</svg>`
  ].join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const manifestForGeneratedAsset = (
  input: AssetGenerationInput,
  kind: AssetGenerationKind
): AvatarManifest => {
  const base = cloneAvatarManifest(input.manifest ?? getDefaultAvatarManifest());
  const prompt = input.prompt.toLowerCase();
  let next = {
    ...base,
    id: makeId("generated_avatar"),
    name: prompt.includes("red") || prompt.includes("朱砂") ? "生成预设 · 朱砂草稿" : "生成预设 · 玉璃草稿",
    description: `MockAssetProvider generated ${kind} from: ${input.prompt}`,
    updatedAt: nowIso()
  };

  if (prompt.includes("red") || prompt.includes("朱砂")) {
    next = updateMaterialSlot(next, "outerRobe", {
      color: "#a33a32",
      secondaryColor: "#e7bd72",
      material: "embroidered"
    });
    next = updateMaterialSlot(next, "backgroundGlow", {
      color: "#9f3831",
      secondaryColor: "#e2b467"
    });
    return {
      ...next,
      hair: { ...next.hair, bun: "high_bun", highlightColor: "#8e4d38" },
      outfit: { ...next.outfit, outerRobe: "vermillion_outer", embroidery: 86, fabricWeight: 68 },
      accessories: { ...next.accessories, hairpin: "gold_pin", earrings: "gold_drop", tassel: "long" }
    };
  }

  return {
    ...next,
    hair: { ...next.hair, bun: "half_up", hairLength: 88, highlightColor: "#86a594" },
    outfit: { ...next.outfit, pibo: "double_stream", fabricOpacity: 72, embroidery: 68 },
    accessories: { ...next.accessories, hairpin: "jade_pin", earrings: "jade_drop", jadePendant: "round_jade" }
  };
};

export class MockAssetProvider implements AssetGenerationProvider {
  readonly id = "mock";
  readonly label = "MockAssetProvider";
  private readonly jobs = new Map<string, AssetGenerationJob>();

  async generateConceptImage(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createJob("concept-image", input, 0.02);
  }

  async generateTurnaroundSheet(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createJob("turnaround-sheet", input, 0.04);
  }

  async generateTextureVariation(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createJob("texture-variation", input, 0.01);
  }

  async generateImageTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createJob("image-to-3d", input, 0.12);
  }

  async generateTextTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob> {
    return this.createJob("text-to-3d", input, 0.1);
  }

  async getJobStatus(jobId: string): Promise<AssetGenerationJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Asset generation job not found: ${jobId}`);
    }
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    const manifest = manifestForGeneratedAsset(job.input, job.kind);
    const asset: GeneratedAsset = {
      id: makeId("asset"),
      kind: job.kind,
      title: job.kind === "image-to-3d" || job.kind === "text-to-3d" ? "3D 草稿预览" : "角色资产预览",
      previewUrl: mockPreview(job.kind, manifest.materials.outerRobe.color),
      manifest,
      metadata: {
        provider: this.label,
        renderer: manifest.renderer,
        importPolicy: "preview-first"
      }
    };
    const completed: AssetGenerationJob = {
      ...job,
      status: "completed",
      progress: 100,
      assets: [asset],
      message: "Mock job completed. Preview is ready for import.",
      updatedAt: nowIso()
    };
    this.jobs.set(jobId, completed);
    return completed;
  }

  async importGeneratedAsset(asset: GeneratedAsset): Promise<AvatarManifest> {
    if (asset.manifest) {
      return cloneAvatarManifest(asset.manifest);
    }
    return getDefaultAvatarManifest();
  }

  async testConnection(): Promise<AssetProviderTestResult> {
    return {
      ok: true,
      provider: "mock",
      message: "MockAssetProvider is available locally.",
      latencyMs: 1
    };
  }

  private createJob(
    kind: AssetGenerationKind,
    input: AssetGenerationInput,
    costEstimateUsd: number
  ): AssetGenerationJob {
    const timestamp = nowIso();
    const job: AssetGenerationJob = {
      id: makeId("asset_job"),
      provider: "mock",
      kind,
      status: "running",
      progress: 35,
      input,
      assets: [],
      costEstimateUsd,
      message: "Mock job queued locally. Poll status to complete.",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.jobs.set(job.id, job);
    return job;
  }
}
