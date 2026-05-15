import type { AvatarState } from "./types";

export type AvatarThemeId =
  | "hanfu_jade"
  | "celestial_blue"
  | "ember_orange"
  | "sakura_pink"
  | "noir_violet";

export interface AvatarTheme {
  id: AvatarThemeId;
  name: string;
  hair: string;
  hairShadow: string;
  accent: string;
  accentSoft: string;
  outfit: string;
  outfitTrim: string;
  eye: string;
  glow: string;
  stage: string;
}

export const avatarThemes: Record<AvatarThemeId, AvatarTheme> = {
  hanfu_jade: {
    id: "hanfu_jade",
    name: "Hanfu jade",
    hair: "#2d2522",
    hairShadow: "#0f0d0d",
    accent: "#b8cab7",
    accentSoft: "rgba(184, 202, 183, 0.22)",
    outfit: "#b8c6b8",
    outfitTrim: "#f4ead6",
    eye: "#4f6f61",
    glow: "rgba(218, 197, 139, 0.34)",
    stage: "radial-gradient(circle at 50% 24%, rgba(238, 232, 217, 0.24), rgba(171, 191, 175, 0.12) 36%, transparent 64%)"
  },
  celestial_blue: {
    id: "celestial_blue",
    name: "Celestial blue",
    hair: "#8fd4ff",
    hairShadow: "#315f9a",
    accent: "#72f0ff",
    accentSoft: "rgba(114, 240, 255, 0.18)",
    outfit: "#182a4d",
    outfitTrim: "#b6f4ff",
    eye: "#48d4ff",
    glow: "rgba(75, 205, 255, 0.45)",
    stage: "radial-gradient(circle at 52% 24%, rgba(118, 223, 255, 0.22), rgba(14, 23, 44, 0.08) 34%, transparent 62%)"
  },
  ember_orange: {
    id: "ember_orange",
    name: "Ember orange",
    hair: "#ffb36d",
    hairShadow: "#7a3d26",
    accent: "#ff7c4d",
    accentSoft: "rgba(255, 124, 77, 0.18)",
    outfit: "#35231f",
    outfitTrim: "#ffd0a3",
    eye: "#ffc15e",
    glow: "rgba(255, 130, 76, 0.42)",
    stage: "radial-gradient(circle at 48% 25%, rgba(255, 169, 86, 0.24), rgba(49, 26, 23, 0.08) 36%, transparent 64%)"
  },
  sakura_pink: {
    id: "sakura_pink",
    name: "Sakura pink",
    hair: "#ff9ec6",
    hairShadow: "#8a3e65",
    accent: "#ff6fae",
    accentSoft: "rgba(255, 111, 174, 0.18)",
    outfit: "#342033",
    outfitTrim: "#ffd6e7",
    eye: "#ff7db8",
    glow: "rgba(255, 126, 183, 0.42)",
    stage: "radial-gradient(circle at 50% 24%, rgba(255, 151, 202, 0.22), rgba(55, 30, 54, 0.08) 36%, transparent 64%)"
  },
  noir_violet: {
    id: "noir_violet",
    name: "Noir violet",
    hair: "#b9a7ff",
    hairShadow: "#43316f",
    accent: "#9d7cff",
    accentSoft: "rgba(157, 124, 255, 0.18)",
    outfit: "#181520",
    outfitTrim: "#d7ccff",
    eye: "#b398ff",
    glow: "rgba(158, 123, 255, 0.42)",
    stage: "radial-gradient(circle at 52% 25%, rgba(155, 122, 255, 0.2), rgba(24, 21, 32, 0.08) 36%, transparent 64%)"
  }
};

export const defaultAvatarTheme = avatarThemes.hanfu_jade;

export const stateTone: Record<AvatarState, string> = {
  idle: "steady",
  listening: "focused",
  thinking: "calculating",
  speaking: "speaking",
  happy: "bright",
  confused: "uncertain",
  annoyed: "sharp",
  sleepy: "sleepy",
  error: "faulted",
  hidden: "hidden",
  peeking: "peeking",
  edge_sitting: "edge sitting"
};
