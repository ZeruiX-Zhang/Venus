import type { CharacterAssetManifest } from "./CharacterAssetManifest";
import { yuliQingyiManifest } from "./DefaultCharacterAssets";
import { assertCharacterAssetManifest } from "./validators";

export class CharacterAssetRegistry {
  private readonly manifests = new Map<string, CharacterAssetManifest>();

  constructor(initialManifests: readonly CharacterAssetManifest[] = []) {
    for (const manifest of initialManifests) {
      this.register(manifest);
    }
  }

  register(manifest: CharacterAssetManifest): CharacterAssetManifest {
    const validManifest = assertCharacterAssetManifest(manifest);
    this.manifests.set(validManifest.id, validManifest);
    return validManifest;
  }

  get(id: string): CharacterAssetManifest | undefined {
    return this.manifests.get(id);
  }

  list(): CharacterAssetManifest[] {
    return [...this.manifests.values()];
  }

  getDefault(): CharacterAssetManifest {
    const manifest = this.get(yuliQingyiManifest.id);
    if (!manifest) {
      throw new Error("Default character asset manifest is not registered.");
    }
    return manifest;
  }
}

export const createDefaultCharacterAssetRegistry = (): CharacterAssetRegistry =>
  new CharacterAssetRegistry([yuliQingyiManifest]);
