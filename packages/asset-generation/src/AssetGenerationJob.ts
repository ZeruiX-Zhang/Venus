import type { AvatarManifest } from "@personal-character-agent/avatar-model";
import type { AssetGenerationProviderId } from "./AssetGenerationConfig";

export const assetGenerationKinds = [
  "concept-image",
  "turnaround-sheet",
  "texture-variation",
  "image-to-3d",
  "text-to-3d"
] as const;

export type AssetGenerationKind = (typeof assetGenerationKinds)[number];

export type AssetGenerationStatus = "queued" | "running" | "completed" | "failed";

export interface AssetGenerationInput {
  prompt: string;
  negativePrompt?: string;
  referenceImageName?: string;
  referenceImageDataUrl?: string;
  manifest?: AvatarManifest;
  style?: "guofeng" | "anime" | "semi-realistic";
  count?: number;
}

export interface GeneratedAsset {
  id: string;
  kind: AssetGenerationKind;
  title: string;
  previewUrl: string;
  manifest?: AvatarManifest;
  metadata: Record<string, string>;
}

export interface AssetGenerationJob {
  id: string;
  provider: AssetGenerationProviderId;
  kind: AssetGenerationKind;
  status: AssetGenerationStatus;
  progress: number;
  input: AssetGenerationInput;
  assets: GeneratedAsset[];
  costEstimateUsd: number;
  message: string;
  createdAt: string;
  updatedAt: string;
}
