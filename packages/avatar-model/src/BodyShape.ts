export const avatarPostures = [
  "upright",
  "relaxed",
  "elegant",
  "reserved",
  "playful"
] as const;

export type AvatarPosture = (typeof avatarPostures)[number];

export const avatarSilhouettes = [
  "willow",
  "balanced",
  "petite",
  "ceremonial",
  "scholar"
] as const;

export type AvatarSilhouette = (typeof avatarSilhouettes)[number];

export interface BodyShape {
  height: number;
  headBodyRatio: number;
  shoulderWidth: number;
  waistWidth: number;
  armLength: number;
  legLength: number;
  posture: AvatarPosture;
  silhouette: AvatarSilhouette;
}

export const defaultBodyShape: BodyShape = {
  height: 168,
  headBodyRatio: 7.1,
  shoulderWidth: 42,
  waistWidth: 28,
  armLength: 54,
  legLength: 88,
  posture: "elegant",
  silhouette: "willow"
};
