import { getDefaultAvatarManifest } from "@personal-character-agent/avatar-model";
import { describe, expect, it } from "vitest";
import { MockAssetProvider } from "./MockAssetProvider";

describe("MockAssetProvider", () => {
  it("runs a complete mock job flow", async () => {
    const provider = new MockAssetProvider();
    const started = await provider.generateConceptImage({
      prompt: "玉白浅青绿古风角色设定图",
      manifest: getDefaultAvatarManifest()
    });

    expect(started.status).toBe("running");
    expect(started.progress).toBe(35);

    const completed = await provider.getJobStatus(started.id);

    expect(completed.status).toBe("completed");
    expect(completed.assets).toHaveLength(1);

    const asset = completed.assets[0];
    if (!asset) {
      throw new Error("Expected a generated asset.");
    }
    const imported = await provider.importGeneratedAsset(asset);

    expect(imported.name).toContain("生成预设");
    expect(imported.renderer).toBe("layered-2d");
  });
});
