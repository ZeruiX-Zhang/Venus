import { describe, expect, it } from "vitest";
import {
  avatarPresetLibrary,
  exportAvatarManifest,
  getDefaultAvatarManifest,
  importAvatarManifest,
  updateBodyShape,
  updateFaceShape,
  updateMaterialSlot,
  updateOutfit,
  updatePartColor,
  validateAvatarManifest
} from "./index";

describe("AvatarManifest model", () => {
  it("validates the default manifest", () => {
    const manifest = getDefaultAvatarManifest();

    expect(validateAvatarManifest(manifest)).toEqual({ ok: true, errors: [] });
  });

  it("loads all six default presets", () => {
    expect(avatarPresetLibrary).toHaveLength(6);
    expect(avatarPresetLibrary.map((preset) => preset.name)).toEqual([
      "Mira · 玉璃",
      "Mira · 月白",
      "Mira · 朱砂",
      "Mira · 墨羽",
      "Mira · 天青",
      "Mira · 樱粉"
    ]);
  });

  it("updates per-part color without changing the rest of the manifest", () => {
    const manifest = getDefaultAvatarManifest();
    const updated = updatePartColor(manifest, "outerRobe", "#123456");

    expect(updated.materials.outerRobe.color).toBe("#123456");
    expect(updated.materials.innerRobe.color).toBe(manifest.materials.innerRobe.color);
  });

  it("updates material slots", () => {
    const manifest = getDefaultAvatarManifest();
    const updated = updateMaterialSlot(manifest, "pibo", {
      material: "gauze",
      opacity: 0.25
    });

    expect(updated.materials.pibo.material).toBe("gauze");
    expect(updated.materials.pibo.opacity).toBe(0.25);
  });

  it("updates body shape", () => {
    const manifest = getDefaultAvatarManifest();
    const updated = updateBodyShape(manifest, { height: 176, shoulderWidth: 46 });

    expect(updated.body.height).toBe(176);
    expect(updated.body.shoulderWidth).toBe(46);
  });

  it("updates face shape", () => {
    const manifest = getDefaultAvatarManifest();
    const updated = updateFaceShape(manifest, { faceShape: "round", chinLength: 36 });

    expect(updated.face.faceShape).toBe("round");
    expect(updated.face.chinLength).toBe(36);
  });

  it("updates outfit", () => {
    const manifest = getDefaultAvatarManifest();
    const updated = updateOutfit(manifest, { pibo: "double_stream", fabricOpacity: 42 });

    expect(updated.outfit.pibo).toBe("double_stream");
    expect(updated.outfit.fabricOpacity).toBe(42);
  });

  it("exports and imports a manifest", () => {
    const manifest = getDefaultAvatarManifest();
    const imported = importAvatarManifest(exportAvatarManifest(manifest));

    expect(imported.id).toBe(manifest.id);
    expect(validateAvatarManifest(imported).ok).toBe(true);
  });
});
