import type { AccessorySchema } from "./AccessorySchema";
import type { AvatarPartId } from "./AvatarPart";
import type { BodyShape } from "./BodyShape";
import type { FaceShape } from "./FaceShape";
import type { MaterialSlot } from "./MaterialSlot";
import type { OutfitSchema } from "./OutfitSchema";

export const avatarRendererKinds = ["layered-2d", "live2d", "vrm", "glb"] as const;
export type AvatarRendererKind = (typeof avatarRendererKinds)[number];

export const avatarStyleKinds = ["guofeng", "anime", "semi-realistic", "pixel"] as const;
export type AvatarStyleKind = (typeof avatarStyleKinds)[number];

export const avatarMotionIds = [
  "idle",
  "blink",
  "speaking",
  "happy",
  "confused",
  "annoyed",
  "sleepy",
  "peeking",
  "edge_sitting"
] as const;

export type AvatarMotionId = (typeof avatarMotionIds)[number];

export interface AvatarMotion {
  id: AvatarMotionId;
  label: string;
  expression: "calm" | "smile" | "thinking" | "open" | "flat" | "sleep" | "peek" | "sit";
  intensity: number;
}

export const frontHairOptions = ["soft_bangs", "side_part", "curtain_bangs", "straight_bangs"] as const;
export type FrontHairOption = (typeof frontHairOptions)[number];

export const sideHairOptions = ["long_side_locks", "short_side_locks", "asymmetric", "none"] as const;
export type SideHairOption = (typeof sideHairOptions)[number];

export const backHairOptions = ["flowing_long", "cloud_long", "short_layered", "braided"] as const;
export type BackHairOption = (typeof backHairOptions)[number];

export const bunOptions = ["half_up", "high_bun", "double_bun", "low_bun", "none"] as const;
export type BunOption = (typeof bunOptions)[number];

export interface HairSchema {
  frontHair: FrontHairOption;
  sideHair: SideHairOption;
  backHair: BackHairOption;
  bun: BunOption;
  hairLength: number;
  hairColor: string;
  highlightColor: string;
  hairAccessorySlots: string[];
}

export interface AvatarManifest {
  id: string;
  name: string;
  description: string;
  renderer: AvatarRendererKind;
  style: AvatarStyleKind;
  body: BodyShape;
  face: FaceShape;
  hair: HairSchema;
  outfit: OutfitSchema;
  accessories: AccessorySchema;
  materials: Record<AvatarPartId, MaterialSlot>;
  motions: Record<AvatarMotionId, AvatarMotion>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const defaultHairSchema: HairSchema = {
  frontHair: "soft_bangs",
  sideHair: "long_side_locks",
  backHair: "flowing_long",
  bun: "half_up",
  hairLength: 82,
  hairColor: "#24201f",
  highlightColor: "#7d8f82",
  hairAccessorySlots: ["hairpin", "ribbon"]
};

export const defaultMotions: Record<AvatarMotionId, AvatarMotion> = {
  idle: { id: "idle", label: "待机", expression: "calm", intensity: 0.3 },
  blink: { id: "blink", label: "眨眼", expression: "calm", intensity: 0.45 },
  speaking: { id: "speaking", label: "说话", expression: "open", intensity: 0.64 },
  happy: { id: "happy", label: "开心", expression: "smile", intensity: 0.78 },
  confused: { id: "confused", label: "困惑", expression: "thinking", intensity: 0.58 },
  annoyed: { id: "annoyed", label: "生气", expression: "flat", intensity: 0.6 },
  sleepy: { id: "sleepy", label: "困倦", expression: "sleep", intensity: 0.52 },
  peeking: { id: "peeking", label: "探头", expression: "peek", intensity: 0.72 },
  edge_sitting: { id: "edge_sitting", label: "坐在边缘", expression: "sit", intensity: 0.68 }
};
