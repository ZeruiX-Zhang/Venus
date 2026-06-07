import type { AvatarState } from "@personal-character-agent/avatar-runtime";

// 表情按钮：只保留"有对应动画、且适合主动触发"的正向动作。
// 负面反应（吐槽/哭泣/害怕/逃跑/警惕）不在这里，而是点击角色身体部位（调戏）时触发。
export type CharacterEmoteId = "cheer" | "dance" | "snark";

export type LocaleCode = "zh" | "en";

export interface CharacterEmote {
  id: CharacterEmoteId;
  emoji: string;
  label: { zh: string; en: string };
  /** Short in-character line that surfaces when this emote is triggered. */
  line: { zh: string; en: string };
  avatarState: AvatarState;
  /** Whether this emote is suitable when minor-safe mode is on. All true for v0.4. */
  minorSafe: boolean;
  /** 点击该表情时，舞台 3D 模型播放的动画片段序号（0-6）。 */
  clipIndex: number;
}

// 动画片段语义（校准结果）：0吐槽 1哭泣 2害怕 3逃跑 4警惕 5鼓掌 6跳舞
export const characterEmotes: CharacterEmote[] = [
  {
    id: "cheer",
    clipIndex: 5, // 鼓掌
    emoji: "👏",
    label: { zh: "鼓掌", en: "Applause" },
    line: {
      zh: "玉璃清仪盈盈鼓掌，眉眼弯弯：「妙哉！」",
      en: "Yuli Qingyi claps softly, eyes curving into a smile."
    },
    avatarState: "happy",
    minorSafe: true
  },
  {
    id: "dance",
    clipIndex: 6, // 跳舞
    emoji: "💃",
    label: { zh: "起舞", en: "Dance" },
    line: {
      zh: "玉璃清仪广袖轻扬，翩然起舞。",
      en: "Yuli Qingyi lifts her long sleeves and dances gracefully."
    },
    avatarState: "happy",
    minorSafe: true
  },
  {
    id: "snark",
    clipIndex: 0, // 吐槽
    emoji: "😏",
    label: { zh: "吐槽", en: "Snark" },
    line: {
      zh: "玉璃清仪睨你一眼：「就你话多。」",
      en: "Yuli Qingyi gives you a sidelong glance: \"You do talk a lot.\""
    },
    avatarState: "annoyed",
    minorSafe: true
  }
];

export const getEmoteCopy = (
  emote: CharacterEmote,
  language: LocaleCode
): { label: string; line: string } => ({
  label: emote.label[language],
  line: emote.line[language]
});

export const getEmoteById = (
  id: CharacterEmoteId
): CharacterEmote | undefined =>
  characterEmotes.find((entry) => entry.id === id);

/**
 * Quick emoji set surfaced on the stage composer so the user can
 * gesture back at the character. Each picks a default reply emote.
 */
export interface QuickEmoji {
  emoji: string;
  triggers: CharacterEmoteId;
  label: { zh: string; en: string };
}

export const quickEmojiPalette: QuickEmoji[] = [
  { emoji: "👏", triggers: "cheer", label: { zh: "鼓掌", en: "Clap" } },
  { emoji: "💃", triggers: "dance", label: { zh: "起舞", en: "Dance" } }
];

/**
 * Detect whether an incoming user message is primarily an emoji reaction.
 * When true, the app can respond with a matching character emote.
 */
export const classifyUserEmoji = (
  input: string
): CharacterEmoteId | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length > 12) return null;
  const mapping: Array<{ pattern: RegExp; id: CharacterEmoteId }> = [
    { pattern: /[\u{1F483}\u{1F57A}]/u, id: "dance" }, // 💃 🕺
    { pattern: /[\u{1F44F}\u{2728}\u{1F31F}]/u, id: "cheer" } // 👏 ✨ 🌟
  ];
  for (const entry of mapping) {
    if (entry.pattern.test(trimmed)) {
      return entry.id;
    }
  }
  // Fallback: if the message is only emoji-like characters, applaud.
  const emojiOnly = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u.test(
    trimmed
  );
  return emojiOnly ? "cheer" : null;
};
