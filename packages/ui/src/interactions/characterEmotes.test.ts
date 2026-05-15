import { describe, expect, it } from "vitest";
import {
  characterEmotes,
  classifyUserEmoji,
  getEmoteById,
  getEmoteCopy,
  quickEmojiPalette
} from "./characterEmotes";

describe("character emotes", () => {
  it("exposes a minor-safe emote set", () => {
    expect(characterEmotes.length).toBeGreaterThan(5);
    expect(characterEmotes.every((emote) => emote.minorSafe)).toBe(true);
  });

  it("resolves emote copy in both languages", () => {
    const emote = characterEmotes[0]!;
    expect(getEmoteCopy(emote, "zh").label.length).toBeGreaterThan(0);
    expect(getEmoteCopy(emote, "en").label.length).toBeGreaterThan(0);
  });

  it("looks emotes up by id", () => {
    const wave = getEmoteById("wave");
    expect(wave?.id).toBe("wave");
  });

  it("classifies wave and tea emoji", () => {
    expect(classifyUserEmoji("👋")).toBe("wave");
    expect(classifyUserEmoji("🍵")).toBe("calm");
    expect(classifyUserEmoji("hello there")).toBeNull();
  });

  it("covers every quick emoji with a valid emote id", () => {
    for (const entry of quickEmojiPalette) {
      expect(getEmoteById(entry.triggers)).toBeDefined();
    }
  });
});
