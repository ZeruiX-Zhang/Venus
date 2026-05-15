import { describe, expect, it } from "vitest";
import { yuliQingyiManifest } from "./DefaultCharacterAssets";
import {
  createImageFallbackCandidates,
  loadCharacterAssetManifest,
  publicPathForCharacterAsset,
  resolveCharacterAsset,
  resolveCharacterAssetPath
} from "./CharacterAssetLoader";
import { validateCharacterAssetManifest } from "./validators";

describe("Character asset manifest validation", () => {
  it("accepts the default Yuli Qingyi manifest", () => {
    const result = validateCharacterAssetManifest(yuliQingyiManifest);

    expect(result.success).toBe(true);
  });

  it("reports missing required nested fields", () => {
    const result = validateCharacterAssetManifest({
      id: "broken",
      assets: { stage: {} }
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.some((issue) => issue.path === "displayName")).toBe(true);
      expect(result.issues.some((issue) => issue.path === "assets.stage.fullbodyFront")).toBe(true);
    }
  });
});

describe("Character asset path resolution", () => {
  it("resolves relative manifest paths under the asset root", () => {
    expect(resolveCharacterAssetPath(yuliQingyiManifest, "stage/fullbody-front.png")).toBe(
      "/assets/characters/yuli-qingyi/stage/fullbody-front.png"
    );
  });

  it("keeps the manifest png first while retaining webp and jpeg fallback candidates", () => {
    expect(createImageFallbackCandidates("/asset/fullbody.png")).toEqual([
      "/asset/fullbody.png",
      "/asset/fullbody.webp",
      "/asset/fullbody.jpg",
      "/asset/fullbody.jpeg"
    ]);
  });

  it("selects local stage image before any procedural fallback", () => {
    const resolution = resolveCharacterAsset(yuliQingyiManifest, {
      view: "fullbody",
      state: "idle"
    });

    expect(resolution.status).toBe("local-image");
    if (resolution.status === "local-image") {
      expect(resolution.expectedPath).toContain("stage/fullbody-front.png");
      expect(resolution.candidates[0]).toContain("stage/fullbody-front.png");
    }
  });

  it("uses the avatar image before preset-card for chat avatars", () => {
    const resolution = resolveCharacterAsset(yuliQingyiManifest, {
      view: "avatar",
      state: "idle"
    });

    expect(resolution.status).toBe("local-image");
    if (resolution.status === "local-image") {
      expect(resolution.candidates[0]).toContain("portraits/avatar.png");
      expect(resolution.candidates).toContain("/assets/characters/yuli-qingyi/thumbnails/preset-card.png");
    }
  });

  it("falls back procedurally only when no manifest is available", () => {
    const resolution = resolveCharacterAsset(undefined, {
      view: "fullbody",
      state: "idle"
    });

    expect(resolution.status).toBe("procedural-fallback");
  });

  it("loads and stamps manifest root from a public manifest url", async () => {
    const manifest = await loadCharacterAssetManifest(
      "/assets/characters/yuli-qingyi/manifest.json",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ...yuliQingyiManifest,
          assetRoot: undefined
        })
      })
    );

    expect(manifest.assetRoot).toBe("/assets/characters/yuli-qingyi");
  });

  it("converts browser asset URLs to public import paths for missing states", () => {
    expect(publicPathForCharacterAsset("/assets/characters/yuli-qingyi/stage/fullbody-front.png")).toBe(
      "public/assets/characters/yuli-qingyi/stage/fullbody-front.png"
    );
  });
});
