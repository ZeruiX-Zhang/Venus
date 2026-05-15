import type { AvatarState } from "./types";

/**
 * PixelPortrait
 *
 * A small, premium "Claude-Code-style" block avatar renderer that
 * can be driven by either a procedural palette (default for Yuli Qingyi)
 * or by a user-uploaded image that is pixelized to a fixed grid.
 *
 * The portrait is stored as a flat array of hex color strings
 * (top-left → bottom-right, row-major) plus a shared palette so
 * storage and rendering stay lean.
 */

export type PixelHex = string;

export interface PixelPortraitPalette {
  /** Background color shown beneath transparent cells. */
  background: PixelHex;
  /** Accent color used for speaking / happy state sparkles. */
  accent: PixelHex;
  /** Safety/minor-mode highlight ring color. */
  safety: PixelHex;
  /** Memory recall highlight ring color. */
  memory: PixelHex;
}

export interface PixelPortrait {
  id: string;
  name: string;
  /** Number of cells per row / column. Square grid for simplicity. */
  size: number;
  /** `size * size` hex colors. Use "" or "transparent" for empty cells. */
  cells: PixelHex[];
  palette: PixelPortraitPalette;
  /** How the portrait was produced. Useful for UX labels. */
  origin: "procedural" | "upload" | "import";
  /** Optional source label (e.g. original file name). */
  sourceName?: string;
  /** Optional caption line shown under the pixel stage. */
  caption?: string;
  updatedAt: string;
}

export const DEFAULT_PIXEL_SIZE = 16;

const ISO_NOW = (): string => new Date().toISOString();

const defaultPalette: PixelPortraitPalette = {
  background: "#0d1220",
  accent: "#ffd27f",
  safety: "#ff9a76",
  memory: "#7ee6b5"
};

/** Hex string → [r,g,b] normalized 0..255. */
const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0]! + clean[0]!, 16),
      parseInt(clean[1]! + clean[1]!, 16),
      parseInt(clean[2]! + clean[2]!, 16)
    ];
  }
  return [
    parseInt(clean.slice(0, 2) || "0", 16),
    parseInt(clean.slice(2, 4) || "0", 16),
    parseInt(clean.slice(4, 6) || "0", 16)
  ];
};

/** Normalize arbitrary component to 2-digit hex. */
const channelToHex = (value: number): string =>
  Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");

export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;

/** Clamp + mix two hex colors. */
export const mixHex = (a: PixelHex, b: PixelHex, t: number): PixelHex => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const ratio = Math.max(0, Math.min(1, t));
  return rgbToHex(
    ar + (br - ar) * ratio,
    ag + (bg - ag) * ratio,
    ab + (bb - ab) * ratio
  );
};

/**
 * Build the default Yuli Qingyi procedural portrait. 16x16 block art
 * inspired by a calm guofeng companion: teal hair, peach skin, jade robe.
 */
export const createDefaultPixelPortrait = (): PixelPortrait => {
  const size = 16;
  const skin = "#ffe5d1";
  const blush = "#ffb9a8";
  const hair = "#3a2c52";
  const hairHi = "#5f4a83";
  const robe = "#d9efe5";
  const robeHi = "#f6fbf7";
  const sash = "#8fd4b9";
  const eye = "#1c2c46";
  const mouth = "#c25d6b";
  const pin = "#ffd27f";
  const empty = "";

  // 16x16 grid hand-written so the stage has a readable companion silhouette.
  // `.` = transparent, numbers map to palette indices below.
  const key: Record<string, PixelHex> = {
    ".": empty,
    "H": hair,
    "h": hairHi,
    "S": skin,
    "b": blush,
    "R": robe,
    "r": robeHi,
    "B": sash,
    "E": eye,
    "M": mouth,
    "P": pin
  };

  const map = [
    "....HHHhhHH.....",
    "...HHHhhhHHH....",
    "..HHhhPPhhHHH...",
    "..HhhSSSShhhH...",
    "..HhSSSSSShH....",
    "..HSSbESEbSH....",
    "..HSSSSMSSH.....",
    "...HSSSSSH......",
    "....HSSSH.......",
    "...RRRRRRR......",
    "..RRrRRRrRR.....",
    ".RRrRRRRRrRR....",
    ".RRRRRBBBRRR....",
    ".RRRBBBBBRRR....",
    "..RRRBBBRRR.....",
    "...RRRRRRR......"
  ];

  const cells: PixelHex[] = [];
  for (const row of map) {
    const padded = row.padEnd(size, ".").slice(0, size);
    for (const ch of padded) {
      cells.push(key[ch] ?? empty);
    }
  }

  return {
    id: "default-yuli-qingyi",
    name: "玉璃清仪 · 像素方块",
    size,
    cells,
    palette: { ...defaultPalette },
    origin: "procedural",
    updatedAt: ISO_NOW()
  };
};

/** Build an empty portrait filled with a single color. Useful in tests. */
export const createBlankPixelPortrait = (
  size = DEFAULT_PIXEL_SIZE,
  color: PixelHex = ""
): PixelPortrait => ({
  id: `blank-${Date.now().toString(36)}`,
  name: "Blank portrait",
  size,
  cells: Array.from({ length: size * size }, () => color),
  palette: { ...defaultPalette },
  origin: "procedural",
  updatedAt: ISO_NOW()
});

export interface PixelizeOptions {
  size?: number;
  /** Source name stored on the portrait for UI labelling. */
  sourceName?: string;
}

/**
 * Convert a browser `HTMLImageElement` into a pixel portrait.
 *
 * Uses a hidden canvas to down-sample the image into `size x size` cells.
 * Returns a portrait with `origin: "upload"` that is ready to render.
 *
 * Designed to be called in the browser only.
 */
export const pixelizeImage = (
  image: HTMLImageElement,
  options: PixelizeOptions = {}
): PixelPortrait => {
  if (typeof document === "undefined") {
    throw new Error("pixelizeImage requires a browser document.");
  }
  const size = Math.max(8, Math.min(48, options.size ?? DEFAULT_PIXEL_SIZE));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("2D canvas context unavailable.");
  }
  ctx.imageSmoothingEnabled = true;
  // Keep aspect by letter-boxing: fit the image inside the square, centered.
  const srcW = image.naturalWidth || image.width || 1;
  const srcH = image.naturalHeight || image.height || 1;
  const scale = Math.min(size / srcW, size / srcH);
  const drawW = Math.max(1, Math.round(srcW * scale));
  const drawH = Math.max(1, Math.round(srcH * scale));
  const dx = Math.floor((size - drawW) / 2);
  const dy = Math.floor((size - drawH) / 2);
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(image, dx, dy, drawW, drawH);
  const imageData = ctx.getImageData(0, 0, size, size).data;

  const cells: PixelHex[] = [];
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < imageData.length; i += 4) {
    const alpha = imageData[i + 3] ?? 0;
    if (alpha < 32) {
      cells.push("");
      continue;
    }
    const cr = imageData[i] ?? 0;
    const cg = imageData[i + 1] ?? 0;
    const cb = imageData[i + 2] ?? 0;
    cells.push(rgbToHex(cr, cg, cb));
    r += cr;
    g += cg;
    b += cb;
    count += 1;
  }

  const averageHex = count > 0
    ? rgbToHex(r / count, g / count, b / count)
    : defaultPalette.background;
  const accentHex = mixHex(averageHex, "#ffffff", 0.35);

  return {
    id: `upload-${Date.now().toString(36)}`,
    name: options.sourceName ? `像素 · ${options.sourceName}` : "上传像素方块",
    size,
    cells,
    palette: {
      background: mixHex(averageHex, "#000000", 0.6),
      accent: accentHex,
      safety: defaultPalette.safety,
      memory: defaultPalette.memory
    },
    origin: "upload",
    ...(options.sourceName ? { sourceName: options.sourceName } : {}),
    updatedAt: ISO_NOW()
  };
};

/** Rotation / mood helpers so the same cell map can react to state. */
export const getPixelMood = (
  state: AvatarState,
  memoryActive: boolean,
  safetyActive: boolean
): {
  ringColor: PixelHex | null;
  pulse: number;
  tilt: number;
  accentLevel: number;
} => {
  const pulseMap: Partial<Record<AvatarState, number>> = {
    idle: 1,
    listening: 1.15,
    thinking: 1.3,
    speaking: 1.45,
    happy: 1.4,
    confused: 1.1,
    annoyed: 1.05,
    sleepy: 0.8,
    error: 1.6,
    hidden: 0.2,
    peeking: 0.9,
    edge_sitting: 1
  };
  const tiltMap: Partial<Record<AvatarState, number>> = {
    idle: 0,
    listening: -1.4,
    thinking: -2.6,
    speaking: 1.2,
    happy: 2,
    confused: -4,
    annoyed: -3,
    sleepy: -3.5,
    error: 3,
    hidden: 0,
    peeking: -6,
    edge_sitting: 4
  };
  const accentMap: Partial<Record<AvatarState, number>> = {
    idle: 0.35,
    listening: 0.55,
    thinking: 0.7,
    speaking: 1,
    happy: 1,
    confused: 0.5,
    annoyed: 0.3,
    sleepy: 0.2,
    error: 0.9,
    hidden: 0,
    peeking: 0.4,
    edge_sitting: 0.4
  };
  return {
    ringColor: safetyActive ? "#ff9a76" : memoryActive ? "#7ee6b5" : null,
    pulse: pulseMap[state] ?? 1,
    tilt: tiltMap[state] ?? 0,
    accentLevel: accentMap[state] ?? 0.4
  };
};

/** JSON serialization helpers for localStorage round-trips. */
export const serializePixelPortrait = (portrait: PixelPortrait): string =>
  JSON.stringify(portrait);

export const parsePixelPortrait = (input: string): PixelPortrait | null => {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<PixelPortrait>;
    if (
      typeof candidate.size !== "number" ||
      !Array.isArray(candidate.cells) ||
      candidate.cells.length !== candidate.size * candidate.size ||
      !candidate.palette ||
      typeof candidate.palette !== "object"
    ) {
      return null;
    }
    return {
      id: candidate.id ?? `portrait-${Date.now().toString(36)}`,
      name: candidate.name ?? "Pixel portrait",
      size: candidate.size,
      cells: candidate.cells.map((cell) =>
        typeof cell === "string" ? cell : ""
      ),
      palette: {
        background: candidate.palette.background ?? defaultPalette.background,
        accent: candidate.palette.accent ?? defaultPalette.accent,
        safety: candidate.palette.safety ?? defaultPalette.safety,
        memory: candidate.palette.memory ?? defaultPalette.memory
      },
      origin: candidate.origin === "upload" || candidate.origin === "import"
        ? candidate.origin
        : "procedural",
      ...(candidate.sourceName ? { sourceName: candidate.sourceName } : {}),
      ...(candidate.caption ? { caption: candidate.caption } : {}),
      updatedAt: candidate.updatedAt ?? ISO_NOW()
    };
  } catch {
    return null;
  }
};
