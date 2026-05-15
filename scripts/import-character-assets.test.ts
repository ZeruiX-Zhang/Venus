import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { validateCharacterAssetManifest } from "../packages/avatar-assets/src/validators";
import { importCharacterAssets } from "./import-character-assets";

const workspaceRoot = process.cwd();

const createFixtureImage = async (
  filePath: string,
  width: number,
  height: number,
  color: { r: number; g: number; b: number; alpha: number }
): Promise<void> => {
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: color
    }
  }).png().toFile(filePath);
};

describe("local character asset importer", () => {
  it("scans messy file names and builds a product-ready yuli-qingyi asset pack", async () => {
    const testRoot = path.join(workspaceRoot, ".tmp", `asset-import-${Date.now()}`);
    const sourceDir = path.join(testRoot, "_asset_intake", "yuli-qingyi-raw");
    const outputRoot = path.join(testRoot, "public", "assets", "characters", "yuli-qingyi");

    await rm(testRoot, { recursive: true, force: true });
    await mkdir(sourceDir, { recursive: true });

    const fixtures = [
      ["ChatGPT Image 2026年5月10日 23_40_09 (1).png", 768, 1344],
      ["ChatGPT Image 2026年5月10日 23_40_09 (2).png", 2200, 920],
      ["ChatGPT Image 2026年5月10日 23_40_09 (3).png", 1024, 1024],
      ["ChatGPT Image 2026年5月10日 23_40_10 (4).png", 1800, 900],
      ["ChatGPT Image 2026年5月10日 23_40_10 (5).png", 2000, 920],
      ["ChatGPT Image 2026年5月10日 23_40_11 (6).png", 1600, 980],
      ["ChatGPT Image 2026年5月10日 23_40_11 (7).png", 820, 1400],
      ["ChatGPT Image 2026年5月10日 23_40_12 (8).png", 900, 1200],
      ["ChatGPT Image 2026年5月10日 23_40_12 (9).png", 900, 1180],
      ["ChatGPT Image 2026年5月10日 23_40_13 (10).png", 900, 1280]
    ] as const;

    await Promise.all(fixtures.map(([name, width, height], index) =>
      createFixtureImage(
        path.join(sourceDir, name),
        width,
        height,
        { r: 180 - index * 6, g: 210 - index * 4, b: 190 + index * 3, alpha: index === 6 ? 0.65 : 1 }
      )
    ));

    const report = await importCharacterAssets({
      character: "yuli-qingyi",
      source: path.relative(workspaceRoot, sourceDir),
      outputRoot
    });

    expect(report.scannedCount).toBe(10);
    expect(report.mappings.fullbodyFront?.sourceFile).toContain("(1).png");
    expect(report.mappings.turnaroundSheet?.sourceFile).toContain("(2).png");
    expect(report.mappings.transparentFullbody?.sourceFile).toContain("(3).png");
    expect(report.mappings.halfbody?.sourceFile).toContain("(4).png");
    expect(report.mappings.avatar?.sourceFile).toContain("(5).png");
    expect(report.mappings.expressionSheet?.sourceFile).toContain("(7).png");

    await expect(stat(path.join(outputRoot, "original", "source-01.png"))).resolves.toBeTruthy();
    await expect(stat(path.join(outputRoot, "stage", "fullbody-front.png"))).resolves.toBeTruthy();
    await expect(stat(path.join(outputRoot, "portraits", "chat-thinking.png"))).resolves.toBeTruthy();
    await expect(stat(path.join(outputRoot, "generated", "contact-sheet.png"))).resolves.toBeTruthy();
    await expect(stat(path.join(outputRoot, "generated", "import-report.json"))).resolves.toBeTruthy();

    const manifest = JSON.parse(await readFile(path.join(outputRoot, "manifest.json"), "utf8")) as unknown;
    const validation = validateCharacterAssetManifest(manifest);
    expect(validation.success).toBe(true);
    expect(JSON.stringify(manifest)).toContain("/assets/characters/yuli-qingyi/stage/fullbody-front.png");
    expect(JSON.stringify(manifest)).toContain("user-provided-local-asset");

    await rm(testRoot, { recursive: true, force: true });
  });
});
