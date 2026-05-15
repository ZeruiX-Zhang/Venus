export const faceShapeOptions = [
  "oval",
  "round",
  "cool",
  "soft_v",
  "heart"
] as const;

export type FaceShapeOption = (typeof faceShapeOptions)[number];

export const eyeShapeOptions = ["almond", "phoenix", "round", "cool"] as const;
export type EyeShapeOption = (typeof eyeShapeOptions)[number];

export const browStyleOptions = ["soft_arch", "straight", "willow", "sharp"] as const;
export type BrowStyleOption = (typeof browStyleOptions)[number];

export const noseStyleOptions = ["small", "straight", "soft"] as const;
export type NoseStyleOption = (typeof noseStyleOptions)[number];

export const mouthStyleOptions = ["gentle", "smile", "calm", "serious"] as const;
export type MouthStyleOption = (typeof mouthStyleOptions)[number];

export const makeupStyleOptions = ["none", "soft", "ceremonial", "cool"] as const;
export type MakeupStyleOption = (typeof makeupStyleOptions)[number];

export interface FaceShape {
  faceShape: FaceShapeOption;
  faceWidth: number;
  jawSoftness: number;
  cheekFullness: number;
  chinLength: number;
  eyeShape: EyeShapeOption;
  eyeSize: number;
  eyeColor: string;
  browStyle: BrowStyleOption;
  noseStyle: NoseStyleOption;
  mouthStyle: MouthStyleOption;
  blush: number;
  makeupStyle: MakeupStyleOption;
}

export const defaultFaceShape: FaceShape = {
  faceShape: "oval",
  faceWidth: 50,
  jawSoftness: 72,
  cheekFullness: 58,
  chinLength: 48,
  eyeShape: "almond",
  eyeSize: 56,
  eyeColor: "#607c72",
  browStyle: "willow",
  noseStyle: "small",
  mouthStyle: "gentle",
  blush: 34,
  makeupStyle: "soft"
};
