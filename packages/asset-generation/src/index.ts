export * from "./AssetGenerationConfig";
export * from "./AssetGenerationJob";
export * from "./AssetGenerationProvider";
export * from "./ComfyUIProvider";
export * from "./MeshyProvider";
export * from "./MockAssetProvider";
export * from "./TripoProvider";

import { ComfyUIProvider } from "./ComfyUIProvider";
import type { AssetGenerationConfig } from "./AssetGenerationConfig";
import type { AssetGenerationProvider } from "./AssetGenerationProvider";
import { MeshyProvider } from "./MeshyProvider";
import { MockAssetProvider } from "./MockAssetProvider";
import { TripoProvider } from "./TripoProvider";

export const createAssetGenerationProvider = (
  config: AssetGenerationConfig
): AssetGenerationProvider => {
  if (config.provider === "comfyui") {
    return new ComfyUIProvider(config);
  }
  if (config.provider === "meshy") {
    return new MeshyProvider(config);
  }
  if (config.provider === "tripo") {
    return new TripoProvider(config);
  }
  return new MockAssetProvider();
};
