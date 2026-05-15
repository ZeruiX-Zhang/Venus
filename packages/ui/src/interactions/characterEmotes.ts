import type { AvatarState } from "@personal-character-agent/avatar-runtime";

export type CharacterEmoteId =
  | "wave"
  | "smile"
  | "cheer"
  | "fluster"
  | "sparkle"
  | "calm"
  | "sulk"
  | "sleepy"
  | "wink"
  | "bow";

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
}

export const characterEmotes: CharacterEmote[] = [
  {
    id: "wave",
    emoji: "👋",
    label: { zh: "招手", en: "Wave" },
    line: {
      zh: "玉璃清仪轻轻一笑，向汝招手。",
      en: "Yuli Qingyi waves softly, greeting you."
    },
    avatarState: "happy",
    minorSafe: true
  },
  {
    id: "smile",
    emoji: "🙂",
    label: { zh: "微笑", en: "Smile" },
    line: {
      zh: "妾心悠然，静候汝言。",
      en: "My heart is calm, and I am listening."
    },
    avatarState: "happy",
    minorSafe: true
  },
  {
    id: "cheer",
    emoji: "✨",
    label: { zh: "鼓励", en: "Cheer" },
    line: {
      zh: "此刻加一笔星光与汝同行。",
      en: "Take a little starlight with you for the next step."
    },
    avatarState: "happy",
    minorSafe: true
  },
  {
    id: "fluster",
    emoji: "😳",
    label: { zh: "羞赧", en: "Fluster" },
    line: {
      zh: "汝此言令妾微羞，且容妾整衣。",
      en: "That made me blush a little. Let me smooth my sleeves."
    },
    avatarState: "confused",
    minorSafe: true
  },
  {
    id: "sparkle",
    emoji: "🌟",
    label: { zh: "灵感", en: "Spark" },
    line: {
      zh: "心识一亮，似见新卷。",
      en: "A new thought just sparked. Want me to share it?"
    },
    avatarState: "thinking",
    minorSafe: true
  },
  {
    id: "calm",
    emoji: "🍵",
    label: { zh: "沏茶", en: "Tea" },
    line: {
      zh: "妾且为汝沏一盏清茶，步调慢些无妨。",
      en: "Let me pour a cup of tea with you. We can slow down."
    },
    avatarState: "idle",
    minorSafe: true
  },
  {
    id: "sulk",
    emoji: "😒",
    label: { zh: "小闷", en: "Sulk" },
    line: {
      zh: "妾有些不平，可愿听吾说？",
      en: "I'm a little miffed. May I tell you why?"
    },
    avatarState: "annoyed",
    minorSafe: true
  },
  {
    id: "sleepy",
    emoji: "😴",
    label: { zh: "打盹", en: "Sleepy" },
    line: {
      zh: "夜渐深，妾稍倚一刻再起。",
      en: "It's getting late. I'll rest my eyes a moment."
    },
    avatarState: "sleepy",
    minorSafe: true
  },
  {
    id: "wink",
    emoji: "😉",
    label: { zh: "眨眼", en: "Wink" },
    line: {
      zh: "此节只你我心照。",
      en: "That one is just between us."
    },
    avatarState: "happy",
    minorSafe: true
  },
  {
    id: "bow",
    emoji: "🙇",
    label: { zh: "揖礼", en: "Bow" },
    line: {
      zh: "玉璃清仪执一礼以谢。",
      en: "Yuli Qingyi offers a quiet bow of thanks."
    },
    avatarState: "idle",
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
  { emoji: "👋", triggers: "wave", label: { zh: "打招呼", en: "Hi" } },
  { emoji: "💖", triggers: "smile", label: { zh: "喜欢", en: "Love" } },
  { emoji: "✨", triggers: "cheer", label: { zh: "鼓励", en: "Cheer" } },
  { emoji: "🍵", triggers: "calm", label: { zh: "喝茶", en: "Tea" } },
  { emoji: "🌙", triggers: "sleepy", label: { zh: "晚安", en: "Night" } },
  { emoji: "🙇", triggers: "bow", label: { zh: "致谢", en: "Thanks" } }
];

/**
 * Detect whether an incoming user message is primarily an emoji reaction.
 * When true, the app can respond with a matching character emote rather
 * than going through the full agent workflow.
 */
export const classifyUserEmoji = (
  input: string
): CharacterEmoteId | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length > 12) return null;
  const mapping: Array<{ pattern: RegExp; id: CharacterEmoteId }> = [
    { pattern: /[\u{1F44B}]/u, id: "wave" },
    { pattern: /[\u{1F970}\u{1F60A}\u{1F642}\u{1F60D}\u{2764}\u{1F496}]/u, id: "smile" },
    { pattern: /[\u{2728}\u{1F31F}]/u, id: "cheer" },
    { pattern: /[\u{1F633}\u{1F605}]/u, id: "fluster" },
    { pattern: /[\u{1F914}\u{1F9E0}]/u, id: "sparkle" },
    { pattern: /[\u{1F375}\u{2615}]/u, id: "calm" },
    { pattern: /[\u{1F611}\u{1F612}\u{1F644}]/u, id: "sulk" },
    { pattern: /[\u{1F634}\u{1F31B}\u{1F31C}\u{1F319}]/u, id: "sleepy" },
    { pattern: /[\u{1F609}]/u, id: "wink" },
    { pattern: /[\u{1F647}]/u, id: "bow" }
  ];
  for (const entry of mapping) {
    if (entry.pattern.test(trimmed)) {
      return entry.id;
    }
  }
  // Fallback: if the message is only emoji-like characters, map to cheer.
  const emojiOnly = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u.test(
    trimmed
  );
  return emojiOnly ? "cheer" : null;
};
