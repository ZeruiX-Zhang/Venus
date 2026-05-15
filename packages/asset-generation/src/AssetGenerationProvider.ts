import type { AvatarManifest } from "@personal-character-agent/avatar-model";
import type { AssetProviderTestResult } from "./AssetGenerationConfig";
import type { AssetGenerationInput, AssetGenerationJob, GeneratedAsset } from "./AssetGenerationJob";

export interface AssetGenerationProvider {
  readonly id: string;
  readonly label: string;
  generateConceptImage(input: AssetGenerationInput): Promise<AssetGenerationJob>;
  generateTurnaroundSheet(input: AssetGenerationInput): Promise<AssetGenerationJob>;
  generateTextureVariation(input: AssetGenerationInput): Promise<AssetGenerationJob>;
  generateImageTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob>;
  generateTextTo3D(input: AssetGenerationInput): Promise<AssetGenerationJob>;
  getJobStatus(jobId: string): Promise<AssetGenerationJob>;
  importGeneratedAsset(asset: GeneratedAsset): Promise<AvatarManifest>;
  testConnection(): Promise<AssetProviderTestResult>;
}
