import { pathToFileURL } from "node:url";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata, type OverlayOptions } from "sharp";

const SUPPORTED_IMAGE_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg"]);
const DEFAULT_SOURCE_DIR = "_asset_intake/yuli-qingyi-raw";
const DEFAULT_CHARACTER_ID = "yuli-qingyi";

const CHARACTER_CONFIGS = {
  "yuli-qingyi": {
    id: "yuli-qingyi",
    displayName: "玉璃清仪",
    description: "月白与浅玉绿配色的古风桌面陪伴角色，温柔、清雅、安静、知性。",
    styleTags: [
      "中国古风",
      "月白",
      "浅玉绿",
      "温柔",
      "清雅",
      "桌面陪伴",
      "高级 3D 角色风格"
    ],
    palette: {
      skin: "#F2C6AE",
      hair: "#111111",
      innerCloth: "#F6F1E7",
      outerCloth: "#AFC2B1",
      scarf: "#DDE8DD",
      belt: "#71836E",
      ornament: "#B7D8C2",
      embroidery: "#D7C48A"
    }
  }
} as const;

const slotDefinitions = [
  { key: "fullbodyFront", manifestKey: "assets.stage.fullbodyFront", output: "stage/fullbody-front.png", required: true },
  { key: "halfbody", manifestKey: "assets.stage.halfbody", output: "stage/halfbody.png", required: false },
  { key: "transparentFullbody", manifestKey: "assets.stage.transparentFullbody", output: "stage/transparent-fullbody.png", required: false },
  { key: "turnaroundSheet", manifestKey: "assets.reference.turnaroundSheet", output: "reference/turnaround-sheet.png", required: false },
  { key: "materialDetails", manifestKey: "assets.reference.materialDetails", output: "reference/material-details.png", required: false },
  { key: "actionStates", manifestKey: "assets.reference.actionStates", output: "reference/action-states.png", required: false },
  { key: "avatar", manifestKey: "assets.portraits.avatar", output: "portraits/avatar.png", required: false },
  { key: "expressionSheet", manifestKey: "assets.portraits.expressionSheet", output: "portraits/expression-sheet.png", required: false },
  { key: "neutral", manifestKey: "assets.portraits.neutral", output: "portraits/chat-neutral.png", required: false },
  { key: "smile", manifestKey: "assets.portraits.smile", output: "portraits/chat-smile.png", required: false },
  { key: "thinking", manifestKey: "assets.portraits.thinking", output: "portraits/chat-thinking.png", required: false },
  { key: "confused", manifestKey: "assets.portraits.confused", output: "portraits/chat-confused.png", required: false },
  { key: "shy", manifestKey: "assets.portraits.shy", output: "portraits/chat-shy.png", required: false },
  { key: "annoyed", manifestKey: "assets.portraits.annoyed", output: "portraits/chat-annoyed.png", required: false },
  { key: "presetCard", manifestKey: "assets.thumbnails.presetCard", output: "thumbnails/preset-card.png", required: false }
] as const;

type SlotKey = (typeof slotDefinitions)[number]["key"];

const primaryAutoSlots = [
  "fullbodyFront",
  "turnaroundSheet",
  "transparentFullbody",
  "halfbody",
  "avatar",
  "expressionSheet",
  "actionStates",
  "materialDetails",
  "presetCard"
] as const satisfies readonly SlotKey[];

const preferredOrder: Partial<Record<SlotKey, number>> = {
  fullbodyFront: 1,
  turnaroundSheet: 2,
  transparentFullbody: 3,
  halfbody: 4,
  avatar: 5,
  expressionSheet: 7,
  actionStates: 8,
  materialDetails: 9,
  presetCard: 10
};

const assetMapAliases: Record<string, SlotKey> = {
  fullbodyFront: "fullbodyFront",
  fullbody: "fullbodyFront",
  turnaroundSheet: "turnaroundSheet",
  turnaround: "turnaroundSheet",
  avatar: "avatar",
  expressionSheet: "expressionSheet",
  expressions: "expressionSheet",
  actionStates: "actionStates",
  actions: "actionStates",
  materialDetails: "materialDetails",
  materials: "materialDetails",
  transparentFullbody: "transparentFullbody",
  transparent: "transparentFullbody",
  presetCard: "presetCard",
  thumbnail: "presetCard",
  halfbody: "halfbody",
  neutral: "neutral",
  chatNeutral: "neutral",
  smile: "smile",
  chatSmile: "smile",
  thinking: "thinking",
  chatThinking: "thinking",
  confused: "confused",
  chatConfused: "confused",
  shy: "shy",
  chatShy: "shy",
  annoyed: "annoyed",
  chatAnnoyed: "annoyed"
};

export interface ImportCharacterAssetsOptions {
  character: string;
  source: string;
  cwd?: string | undefined;
  outputRoot?: string | undefined;
}

export interface SourceImageInfo {
  index: number;
  fileName: string;
  sourcePath: string;
  originalCopyName: string;
  originalCopyPath: string;
  width: number;
  height: number;
  aspectRatio: number;
  fileSizeBytes: number;
  hasAlpha: boolean;
  probablyTransparent: boolean | "unknown";
  orderHint?: number | undefined;
}

export interface AssetMappingReportItem {
  slot: SlotKey;
  manifestKey: string;
  outputPath: string;
  publicPath: string;
  sourceFile?: string | undefined;
  originalCopyPath?: string | undefined;
  confidence: number;
  reason: string;
  fallbackFrom?: SlotKey | undefined;
  generated?: boolean | undefined;
  alternates: Array<{
    fileName: string;
    score: number;
    reason: string;
  }>;
}

export interface CharacterImportReport {
  characterId: string;
  displayName: string;
  sourceDir: string;
  outputDir: string;
  generatedAt: string;
  scannedCount: number;
  images: SourceImageInfo[];
  mappings: Record<string, AssetMappingReportItem>;
  missingAssets: string[];
  unusedSources: string[];
  recommendations: string[];
  assetMapOverride: {
    path: string;
    used: boolean;
    warnings: string[];
  };
}

const toPosix = (value: string): string => value.replace(/\\/g, "/");

const publicAssetPath = (characterId: string, relativePath: string): string =>
  `/assets/characters/${characterId}/${toPosix(relativePath)}`;

const round = (value: number, places = 3): number =>
  Number(value.toFixed(places));

const clampConfidence = (value: number): number =>
  round(Math.max(0.05, Math.min(0.99, value)), 2);

const isInside = (parent: string, child: string): boolean => {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

const ensureOutputInsideRepo = (repoRoot: string, outputRoot: string): void => {
  if (!isInside(repoRoot, outputRoot)) {
    throw new Error(`Refusing to write outside the repository: ${outputRoot}`);
  }
};

const extractOrderHint = (fileName: string): number | undefined => {
  const match = fileName.match(/\((\d+)\)(?=\.[^.]+$)/u) ?? fileName.match(/(?:^|[^\d])(\d+)(?=\.[^.]+$)/u);
  return match?.[1] ? Number(match[1]) : undefined;
};

const naturalSortKey = (image: Pick<SourceImageInfo, "fileName" | "orderHint">): string =>
  `${String(image.orderHint ?? 9999).padStart(4, "0")} ${image.fileName}`;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const truncate = (value: string, maxLength: number): string =>
  value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 1))}…` : value;

const imageFileNames = async (sourceDir: string): Promise<string[]> => {
  const entries = await import("node:fs/promises").then((fs) => fs.readdir(sourceDir, { withFileTypes: true }));
  return entries
    .filter((entry) => entry.isFile() && SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const aOrder = extractOrderHint(a) ?? 9999;
      const bOrder = extractOrderHint(b) ?? 9999;
      return aOrder === bOrder ? a.localeCompare(b, "zh-Hans-CN", { numeric: true }) : aOrder - bOrder;
    });
};

const detectTransparency = async (
  sourcePath: string,
  metadata: Metadata
): Promise<boolean | "unknown"> => {
  if (!metadata.hasAlpha) {
    return false;
  }

  try {
    const { data } = await sharp(sourcePath)
      .resize({ width: 48, height: 48, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let index = 3; index < data.length; index += 4) {
      if ((data[index] ?? 255) < 250) {
        return true;
      }
    }
    return false;
  } catch {
    return "unknown";
  }
};

export async function scanSourceImages(sourceDir: string, originalDir: string): Promise<SourceImageInfo[]> {
  await mkdir(originalDir, { recursive: true });
  const fileNames = await imageFileNames(sourceDir);
  const images: SourceImageInfo[] = [];

  for (const [index, fileName] of fileNames.entries()) {
    const sourcePath = path.join(sourceDir, fileName);
    const metadata = await sharp(sourcePath).metadata();
    const fileStats = await stat(sourcePath);
    const extension = path.extname(fileName).toLowerCase();
    const originalCopyName = `source-${String(index + 1).padStart(2, "0")}${extension}`;
    const originalCopyPath = path.join(originalDir, originalCopyName);
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    await copyFile(sourcePath, originalCopyPath);
    images.push({
      index: index + 1,
      fileName,
      sourcePath,
      originalCopyName,
      originalCopyPath: toPosix(path.relative(path.dirname(originalDir), originalCopyPath)),
      width,
      height,
      aspectRatio: width > 0 && height > 0 ? round(width / height) : 0,
      fileSizeBytes: fileStats.size,
      hasAlpha: Boolean(metadata.hasAlpha),
      probablyTransparent: await detectTransparency(sourcePath, metadata),
      orderHint: extractOrderHint(fileName)
    });
  }

  return images.sort((a, b) => naturalSortKey(a).localeCompare(naturalSortKey(b), "zh-Hans-CN", { numeric: true }));
}

const keywordScore = (fileName: string, keywords: readonly string[]): number => {
  const normalized = fileName.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword)) ? 0.22 : 0;
};

const scoreOrder = (slot: SlotKey, image: SourceImageInfo): number => {
  const expected = preferredOrder[slot];
  if (!expected || !image.orderHint) {
    return 0;
  }
  const distance = Math.abs(image.orderHint - expected);
  if (distance === 0) {
    return 0.46;
  }
  if (distance === 1) {
    return 0.18;
  }
  return 0;
};

const scoreShape = (slot: SlotKey, image: SourceImageInfo): number => {
  const aspect = image.aspectRatio;
  const isTall = aspect > 0 && aspect < 0.85;
  const isSquare = aspect >= 0.85 && aspect <= 1.18;
  const isWide = aspect >= 1.35;
  const isVeryWide = aspect >= 1.75;

  if (slot === "fullbodyFront") {
    return (isTall ? 0.3 : 0.08) + (image.height >= image.width ? 0.08 : 0);
  }
  if (slot === "halfbody") {
    return (isTall || isSquare ? 0.24 : 0.08) + (image.orderHint === 4 ? 0.08 : 0);
  }
  if (slot === "transparentFullbody") {
    return (isTall ? 0.2 : 0.05) + (image.probablyTransparent === true ? 0.25 : 0);
  }
  if (slot === "avatar") {
    return isSquare ? 0.54 : aspect > 0.7 && aspect < 1.35 ? 0.14 : 0.04;
  }
  if (slot === "turnaroundSheet") {
    return (isWide ? 0.3 : 0.04) + (isVeryWide ? 0.12 : 0);
  }
  if (slot === "expressionSheet" || slot === "actionStates") {
    return isWide ? 0.28 : isSquare ? 0.12 : 0.04;
  }
  if (slot === "materialDetails") {
    return isWide || isSquare ? 0.2 : 0.08;
  }
  if (slot === "presetCard") {
    return isTall ? 0.26 : isSquare ? 0.18 : 0.08;
  }
  return 0.05;
};

const scoreImageForSlot = (
  slot: SlotKey,
  image: SourceImageInfo,
  largestArea: number
): { score: number; reason: string } => {
  const area = image.width * image.height;
  const areaScore = largestArea > 0 ? Math.min(0.1, (area / largestArea) * 0.1) : 0;
  const order = scoreOrder(slot, image);
  const shape = scoreShape(slot, image);
  const keywords = keywordScore(image.fileName, [
    slot,
    slot.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
    "avatar",
    "expression",
    "turnaround",
    "material",
    "action",
    "fullbody",
    "halfbody"
  ]);
  const score = clampConfidence(0.08 + order + shape + keywords + areaScore);
  const reason = [
    order > 0 ? `order hint ${image.orderHint}` : "",
    shape > 0.12 ? `aspect ${image.aspectRatio}` : "",
    image.probablyTransparent === true ? "transparent pixels detected" : "",
    keywords > 0 ? "filename keyword" : "",
    areaScore > 0 ? "usable resolution" : ""
  ].filter(Boolean).join("; ") || "low-confidence geometry match";

  return { score, reason };
};

const sourceNameMap = (images: SourceImageInfo[]): Map<string, SourceImageInfo> => {
  const map = new Map<string, SourceImageInfo>();
  for (const image of images) {
    map.set(image.fileName, image);
    map.set(image.fileName.toLowerCase(), image);
  }
  return map;
};

const readAssetMap = async (
  sourceDir: string,
  images: SourceImageInfo[]
): Promise<{ mappings: Partial<Record<SlotKey, SourceImageInfo>>; path: string; used: boolean; warnings: string[] }> => {
  const assetMapPath = path.join(sourceDir, "asset-map.json");
  const warnings: string[] = [];
  let raw: string;

  try {
    raw = await readFile(assetMapPath, "utf8");
  } catch {
    return { mappings: {}, path: assetMapPath, used: false, warnings };
  }

  const files = sourceNameMap(images);
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const mappings: Partial<Record<SlotKey, SourceImageInfo>> = {};

  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    const slot = assetMapAliases[rawKey];
    if (!slot) {
      warnings.push(`Unknown asset-map key ignored: ${rawKey}`);
      continue;
    }
    if (typeof rawValue !== "string") {
      warnings.push(`asset-map value for ${rawKey} must be a file name.`);
      continue;
    }
    const image = files.get(rawValue) ?? files.get(rawValue.toLowerCase());
    if (!image) {
      warnings.push(`asset-map file not found for ${rawKey}: ${rawValue}`);
      continue;
    }
    mappings[slot] = image;
  }

  return { mappings, path: assetMapPath, used: true, warnings };
};

const buildMappings = async (
  characterId: string,
  sourceDir: string,
  outputRoot: string,
  images: SourceImageInfo[]
): Promise<CharacterImportReport> => {
  const generatedAt = new Date().toISOString();
  const largestArea = Math.max(0, ...images.map((image) => image.width * image.height));
  const usedSources = new Set<string>();
  const mappings = new Map<SlotKey, AssetMappingReportItem>();
  const missingAssets: string[] = [];
  const assetMapOverride = await readAssetMap(sourceDir, images);

  const makeItem = ({
    slot,
    source,
    confidence,
    reason,
    fallbackFrom,
    generated = false,
    alternates = []
  }: {
    slot: SlotKey;
    source?: SourceImageInfo | undefined;
    confidence: number;
    reason: string;
    fallbackFrom?: SlotKey | undefined;
    generated?: boolean | undefined;
    alternates?: AssetMappingReportItem["alternates"] | undefined;
  }): AssetMappingReportItem => {
    const definition = slotDefinitions.find((candidate) => candidate.key === slot);
    if (!definition) {
      throw new Error(`Unknown asset slot: ${slot}`);
    }
    const outputPath = path.join(outputRoot, definition.output);
    return {
      slot,
      manifestKey: definition.manifestKey,
      outputPath: toPosix(outputPath),
      publicPath: publicAssetPath(characterId, definition.output),
      sourceFile: source?.fileName,
      originalCopyPath: source?.originalCopyPath,
      confidence,
      reason,
      fallbackFrom,
      generated,
      alternates
    };
  };

  for (const [slot, source] of Object.entries(assetMapOverride.mappings) as Array<[SlotKey, SourceImageInfo]>) {
    mappings.set(slot, makeItem({
      slot,
      source,
      confidence: 1,
      reason: "manual asset-map.json override",
      alternates: []
    }));
    usedSources.add(source.fileName);
  }

  for (const slot of primaryAutoSlots) {
    if (mappings.has(slot)) {
      continue;
    }

    const scored = images
      .filter((image) => !usedSources.has(image.fileName))
      .map((image) => {
        const result = scoreImageForSlot(slot, image, largestArea);
        return { image, ...result };
      })
      .sort((a, b) => b.score - a.score || naturalSortKey(a.image).localeCompare(naturalSortKey(b.image), "zh-Hans-CN", { numeric: true }));

    const best = scored[0];
    if (best && best.score >= 0.32) {
      mappings.set(slot, makeItem({
        slot,
        source: best.image,
        confidence: best.score,
        reason: best.reason,
        alternates: scored.slice(1, 4).map((candidate) => ({
          fileName: candidate.image.fileName,
          score: candidate.score,
          reason: candidate.reason
        }))
      }));
      usedSources.add(best.image.fileName);
      continue;
    }

    missingAssets.push(slot);
  }

  const fallbackSourceFor = (...slots: SlotKey[]): { slot: SlotKey; source: SourceImageInfo } | undefined => {
    for (const slot of slots) {
      const item = mappings.get(slot);
      const source = item?.sourceFile ? images.find((image) => image.fileName === item.sourceFile) : undefined;
      if (source) {
        return { slot, source };
      }
    }
    return undefined;
  };

  if (!mappings.has("halfbody")) {
    const fallback = fallbackSourceFor("fullbodyFront");
    if (fallback) {
      mappings.set("halfbody", makeItem({
        slot: "halfbody",
        source: fallback.source,
        confidence: 0.55,
        reason: "fallback copy because no reliable halfbody candidate was found",
        fallbackFrom: fallback.slot
      }));
    }
  }

  if (!mappings.has("transparentFullbody")) {
    const fallback = fallbackSourceFor("fullbodyFront");
    if (fallback) {
      mappings.set("transparentFullbody", makeItem({
        slot: "transparentFullbody",
        source: fallback.source,
        confidence: 0.45,
        reason: "fallback copy; no transparent background candidate was confirmed",
        fallbackFrom: fallback.slot
      }));
    }
  }

  if (!mappings.has("presetCard")) {
    const fallback = fallbackSourceFor("halfbody", "fullbodyFront", "avatar");
    if (fallback) {
      mappings.set("presetCard", makeItem({
        slot: "presetCard",
        source: fallback.source,
        confidence: 0.6,
        reason: "generated contain-style preset card from selected character asset",
        fallbackFrom: fallback.slot,
        generated: true
      }));
    }
  }

  if (!mappings.has("expressionSheet")) {
    const fallback = fallbackSourceFor("avatar");
    if (fallback) {
      mappings.set("expressionSheet", makeItem({
        slot: "expressionSheet",
        source: fallback.source,
        confidence: 0.4,
        reason: "fallback copy; no expression-sheet candidate was found",
        fallbackFrom: fallback.slot
      }));
    }
  }

  for (const portraitSlot of ["neutral", "smile", "thinking", "confused", "shy", "annoyed"] as const) {
    if (mappings.has(portraitSlot)) {
      continue;
    }
    const fallback = fallbackSourceFor("avatar", "expressionSheet", "halfbody", "fullbodyFront");
    if (fallback) {
      mappings.set(portraitSlot, makeItem({
        slot: portraitSlot,
        source: fallback.source,
        confidence: portraitSlot === "neutral" ? 0.56 : 0.42,
        reason: "fallback chat portrait generated from avatar/reference asset",
        fallbackFrom: fallback.slot
      }));
    }
  }

  for (const definition of slotDefinitions) {
    if (!mappings.has(definition.key) && !missingAssets.includes(definition.key)) {
      missingAssets.push(definition.key);
    }
  }

  const recommendations = [
    ...missingAssets.map((slot) => `Regenerate or add ${slotDefinitions.find((definition) => definition.key === slot)?.output ?? slot}.`),
    ...[...mappings.values()]
      .filter((item) => item.confidence < 0.55 && !item.fallbackFrom)
      .map((item) => `Review ${item.slot}: confidence ${item.confidence}.`)
  ];

  const config = CHARACTER_CONFIGS[characterId as keyof typeof CHARACTER_CONFIGS] ?? CHARACTER_CONFIGS[DEFAULT_CHARACTER_ID];

  return {
    characterId,
    displayName: config.displayName,
    sourceDir: toPosix(path.relative(process.cwd(), sourceDir) || sourceDir),
    outputDir: toPosix(path.relative(process.cwd(), outputRoot) || outputRoot),
    generatedAt,
    scannedCount: images.length,
    images,
    mappings: Object.fromEntries([...mappings.entries()].map(([slot, item]) => [slot, item])),
    missingAssets,
    unusedSources: images.filter((image) => !usedSources.has(image.fileName)).map((image) => image.fileName),
    recommendations,
    assetMapOverride: {
      path: toPosix(path.relative(process.cwd(), assetMapOverride.path) || assetMapOverride.path),
      used: assetMapOverride.used,
      warnings: assetMapOverride.warnings
    }
  };
};

const copyAsPng = async (sourcePath: string, targetPath: string): Promise<void> => {
  await mkdir(path.dirname(targetPath), { recursive: true });
  if (path.extname(sourcePath).toLowerCase() === ".png") {
    await copyFile(sourcePath, targetPath);
    return;
  }
  await sharp(sourcePath).png({ compressionLevel: 9, quality: 100 }).toFile(targetPath);
};

const createPresetCard = async (sourcePath: string, targetPath: string): Promise<void> => {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const cardWidth = 900;
  const cardHeight = 1200;
  const image = await sharp(sourcePath)
    .resize({
      width: cardWidth - 96,
      height: cardHeight - 120,
      fit: "contain",
      background: { r: 18, g: 28, b: 33, alpha: 0 }
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: cardWidth,
      height: cardHeight,
      channels: 4,
      background: { r: 17, g: 25, b: 31, alpha: 1 }
    }
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="#f4f0e5" stop-opacity="0.14"/>
                <stop offset="0.55" stop-color="#b7d8c2" stop-opacity="0.18"/>
                <stop offset="1" stop-color="#0d141c" stop-opacity="0.2"/>
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
            <rect x="36" y="36" width="${cardWidth - 72}" height="${cardHeight - 72}" rx="28" fill="none" stroke="#d7c48a" stroke-opacity="0.32" stroke-width="2"/>
          </svg>`
        )
      },
      { input: image, gravity: "center" }
    ])
    .png({ compressionLevel: 9 })
    .toFile(targetPath);
};

const writeMappedAssets = async (
  report: CharacterImportReport,
  images: SourceImageInfo[]
): Promise<void> => {
  const imageByFileName = new Map(images.map((image) => [image.fileName, image]));

  for (const item of Object.values(report.mappings)) {
    if (!item.sourceFile) {
      continue;
    }
    const image = imageByFileName.get(item.sourceFile);
    if (!image) {
      continue;
    }
    if (item.slot === "presetCard" && item.generated) {
      await createPresetCard(image.sourcePath, item.outputPath);
    } else {
      await copyAsPng(image.sourcePath, item.outputPath);
    }
  }
};

const createContactSheet = async (
  images: SourceImageInfo[],
  outputPath: string
): Promise<void> => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const columns = Math.min(4, Math.max(1, images.length));
  const cellWidth = 360;
  const cellHeight = 430;
  const labelHeight = 86;
  const rows = Math.max(1, Math.ceil(images.length / columns));

  if (images.length === 0) {
    await sharp({
      create: {
        width: cellWidth,
        height: cellHeight,
        channels: 4,
        background: "#101821"
      }
    }).png().toFile(outputPath);
    return;
  }

  const composites: OverlayOptions[] = [];

  for (const image of images) {
    const zeroIndex = image.index - 1;
    const left = (zeroIndex % columns) * cellWidth;
    const top = Math.floor(zeroIndex / columns) * cellHeight;
    const thumbnail = await sharp(image.sourcePath)
      .resize({
        width: cellWidth - 28,
        height: cellHeight - labelHeight - 26,
        fit: "contain",
        background: "#111a24",
        withoutEnlargement: true
      })
      .extend({
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
        background: "#111a24"
      })
      .png()
      .toBuffer();

    const label = Buffer.from(
      `<svg width="${cellWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0d141d"/>
        <text x="14" y="24" fill="#dbeee6" font-size="18" font-family="Arial, Microsoft YaHei, sans-serif" font-weight="700">#${image.index} ${escapeXml(truncate(image.fileName, 30))}</text>
        <text x="14" y="52" fill="#95a8b8" font-size="14" font-family="Arial, Microsoft YaHei, sans-serif">${image.width}x${image.height} / ${image.aspectRatio}</text>
        <text x="14" y="74" fill="#95a8b8" font-size="13" font-family="Arial, Microsoft YaHei, sans-serif">透明: ${escapeXml(String(image.probablyTransparent))}</text>
      </svg>`
    );

    composites.push({ input: thumbnail, left: left + 14, top: top + 14 });
    composites.push({ input: label, left, top: top + cellHeight - labelHeight });
  }

  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 4,
      background: "#081018"
    }
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
};

const pathFor = (characterId: string, slot: SlotKey): string => {
  const definition = slotDefinitions.find((candidate) => candidate.key === slot);
  if (!definition) {
    throw new Error(`Unknown slot ${slot}`);
  }
  return publicAssetPath(characterId, definition.output);
};

const buildManifest = (
  characterId: string,
  sourceArg: string,
  report: CharacterImportReport
) => {
  const config = CHARACTER_CONFIGS[characterId as keyof typeof CHARACTER_CONFIGS] ?? CHARACTER_CONFIGS[DEFAULT_CHARACTER_ID];
  const mappingConfidence = Object.fromEntries(
    Object.entries(report.mappings).map(([slot, item]) => [slot, item.confidence])
  );
  const fallbackFrom = Object.fromEntries(
    Object.entries(report.mappings)
      .filter(([, item]) => item.fallbackFrom)
      .map(([slot, item]) => [slot, item.fallbackFrom])
  );

  return {
    id: characterId,
    displayName: config.displayName,
    description: config.description,
    styleTags: [...config.styleTags],
    assetRoot: `/assets/characters/${characterId}`,
    assets: {
      stage: {
        fullbodyFront: pathFor(characterId, "fullbodyFront"),
        halfbody: pathFor(characterId, "halfbody"),
        transparentFullbody: pathFor(characterId, "transparentFullbody")
      },
      reference: {
        turnaroundSheet: pathFor(characterId, "turnaroundSheet"),
        materialDetails: pathFor(characterId, "materialDetails"),
        actionStates: pathFor(characterId, "actionStates")
      },
      portraits: {
        avatar: pathFor(characterId, "avatar"),
        expressionSheet: pathFor(characterId, "expressionSheet"),
        neutral: pathFor(characterId, "neutral"),
        smile: pathFor(characterId, "smile"),
        thinking: pathFor(characterId, "thinking"),
        confused: pathFor(characterId, "confused"),
        shy: pathFor(characterId, "shy"),
        annoyed: pathFor(characterId, "annoyed")
      },
      thumbnails: {
        presetCard: pathFor(characterId, "presetCard")
      },
      generated: {
        contactSheet: `/assets/characters/${characterId}/generated/contact-sheet.png`,
        importReport: `/assets/characters/${characterId}/generated/import-report.json`
      }
    },
    palette: config.palette,
    credits: {
      source: "user-provided-local-asset",
      license: "user-owned-or-authorized"
    },
    importInfo: {
      sourceDir: sourceArg,
      generatedAt: report.generatedAt,
      mappingConfidence,
      fallbackFrom,
      missingAssets: report.missingAssets
    }
  };
};

export async function importCharacterAssets(options: ImportCharacterAssetsOptions): Promise<CharacterImportReport> {
  const repoRoot = path.resolve(options.cwd ?? process.cwd());
  const characterId = options.character || DEFAULT_CHARACTER_ID;
  const sourceArg = options.source || DEFAULT_SOURCE_DIR;
  const sourceDir = path.resolve(repoRoot, sourceArg);
  const outputRoot = path.resolve(options.outputRoot ?? path.join(repoRoot, "public", "assets", "characters", characterId));
  const originalDir = path.join(outputRoot, "original");
  const generatedDir = path.join(outputRoot, "generated");

  ensureOutputInsideRepo(repoRoot, outputRoot);

  try {
    const sourceStats = await stat(sourceDir);
    if (!sourceStats.isDirectory()) {
      throw new Error(`SOURCE_ASSET_DIR is not a directory: ${sourceArg}`);
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `SOURCE_ASSET_DIR not found: ${sourceArg}. Create ${sourceArg} and put the PNG/WebP/JPG character images there.`
      );
    }
    throw error;
  }

  await Promise.all([
    mkdir(path.join(outputRoot, "stage"), { recursive: true }),
    mkdir(path.join(outputRoot, "reference"), { recursive: true }),
    mkdir(path.join(outputRoot, "portraits"), { recursive: true }),
    mkdir(path.join(outputRoot, "thumbnails"), { recursive: true }),
    mkdir(generatedDir, { recursive: true })
  ]);

  const images = await scanSourceImages(sourceDir, originalDir);
  const report = await buildMappings(characterId, sourceDir, outputRoot, images);
  await createContactSheet(images, path.join(generatedDir, "contact-sheet.png"));
  await writeMappedAssets(report, images);

  const manifest = buildManifest(characterId, sourceArg, report);
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(generatedDir, "import-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return report;
}

const parseArgs = (argv: string[]): ImportCharacterAssetsOptions => {
  const options: ImportCharacterAssetsOptions = {
    character: DEFAULT_CHARACTER_ID,
    source: DEFAULT_SOURCE_DIR
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--character" && value) {
      options.character = value;
      index += 1;
    } else if (arg === "--source" && value) {
      options.source = value;
      index += 1;
    } else if (arg === "--out" && value) {
      options.outputRoot = value;
      index += 1;
    }
  }

  return options;
};

const isMainModule = (): boolean => {
  const entry = process.argv[1];
  return Boolean(entry && pathToFileURL(path.resolve(entry)).href === import.meta.url);
};

if (isMainModule()) {
  importCharacterAssets(parseArgs(process.argv.slice(2)))
    .then((report) => {
      const mappingSummary = Object.values(report.mappings)
        .map((item) => `${item.slot} <= ${item.sourceFile ?? item.fallbackFrom ?? "missing"} (${item.confidence})`)
        .join("\n");
      console.log([
        `Imported ${report.scannedCount} source images for ${report.displayName}.`,
        `Manifest: public/assets/characters/${report.characterId}/manifest.json`,
        `Contact sheet: public/assets/characters/${report.characterId}/generated/contact-sheet.png`,
        `Import report: public/assets/characters/${report.characterId}/generated/import-report.json`,
        mappingSummary
      ].join("\n"));
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
