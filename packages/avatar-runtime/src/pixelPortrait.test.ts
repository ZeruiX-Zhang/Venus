import { describe, expect, it } from "vitest";
import {
  createBlankPixelPortrait,
  createDefaultPixelPortrait,
  DEFAULT_PIXEL_SIZE,
  getPixelMood,
  mixHex,
  parsePixelPortrait,
  serializePixelPortrait
} from "./PixelPortrait";

describe("PixelPortrait", () => {
  it("creates a default portrait with the expected grid", () => {
    const portrait = createDefaultPixelPortrait();
    expect(portrait.size).toBe(16);
    expect(portrait.cells).toHaveLength(16 * 16);
    expect(portrait.origin).toBe("procedural");
    expect(portrait.palette.background).toMatch(/^#/);
  });

  it("creates blank portraits at the requested size", () => {
    const portrait = createBlankPixelPortrait(10, "#112233");
    expect(portrait.size).toBe(10);
    expect(portrait.cells).toHaveLength(100);
    expect(portrait.cells.every((cell) => cell === "#112233")).toBe(true);
  });

  it("serializes and parses portraits without loss", () => {
    const original = createDefaultPixelPortrait();
    const text = serializePixelPortrait(original);
    const parsed = parsePixelPortrait(text);
    expect(parsed).not.toBeNull();
    expect(parsed?.size).toBe(original.size);
    expect(parsed?.cells).toEqual(original.cells);
  });

  it("returns null when parsing malformed data", () => {
    expect(parsePixelPortrait("not json")).toBeNull();
    expect(parsePixelPortrait(JSON.stringify({ size: 5, cells: [] }))).toBeNull();
  });

  it("mixes hex colors linearly", () => {
    expect(mixHex("#000000", "#ffffff", 0).toLowerCase()).toBe("#000000");
    expect(mixHex("#000000", "#ffffff", 1).toLowerCase()).toBe("#ffffff");
    const mid = mixHex("#000000", "#ffffff", 0.5);
    expect(mid.toLowerCase()).toMatch(/^#(7f|80)/);
  });

  it("provides distinct mood responses per avatar state", () => {
    const idle = getPixelMood("idle", false, false);
    const thinking = getPixelMood("thinking", false, false);
    const safety = getPixelMood("idle", false, true);
    const memory = getPixelMood("idle", true, false);
    expect(idle.pulse).not.toBeCloseTo(thinking.pulse);
    expect(safety.ringColor).toBe("#ff9a76");
    expect(memory.ringColor).toBe("#7ee6b5");
    expect(idle.ringColor).toBeNull();
  });

  it("uses the DEFAULT_PIXEL_SIZE constant for blank portraits", () => {
    const portrait = createBlankPixelPortrait();
    expect(portrait.size).toBe(DEFAULT_PIXEL_SIZE);
  });
});
