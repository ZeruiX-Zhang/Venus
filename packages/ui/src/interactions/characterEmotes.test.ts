import { describe, expect, it } from "vitest";
import {
  characterEmotes,
  classifyUserEmoji,
  getEmoteById,
  getEmoteCopy,
  quickEmojiPalette
} from "./characterEmotes";

describe("character emotes", () => {
  it("exposes a minor-safe emote set mapped to animation clips", () => {
    expect(characterEmotes.length).toBeGreaterThanOrEqual(2);
    expect(characterEmotes.every((emote) => emote.minorSafe)).toBe(true);
    // 每个表情都要绑定一个动画片段序号
    expect(characterEmotes.every((emote) => typeof emote.clipIndex === "number")).toBe(true);
  });

  it("resolves emote copy in both languages", () => {
    const emote = characterEmotes[0]!;
    expect(getEmoteCopy(emote, "zh").label.length).toBeGreaterThan(0);
    expect(getEmoteCopy(emote, "en").label.length).toBeGreaterThan(0);
  });

  it("looks emotes up by id", () => {
    const cheer = getEmoteById("cheer");
    expect(cheer?.id).toBe("cheer");
    expect(cheer?.clipIndex).toBe(5);
  });

  it("classifies clap and dance emoji", () => {
    expect(classifyUserEmoji("👏")).toBe("cheer");
    expect(classifyUserEmoji("💃")).toBe("dance");
    expect(classifyUserEmoji("hello there")).toBeNull();
  });

  it("covers every quick emoji with a valid emote id", () => {
    for (const entry of quickEmojiPalette) {
      expect(getEmoteById(entry.triggers)).toBeDefined();
    }
  });
});
