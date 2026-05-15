export const avatarLayerIds = [
  "backgroundGlow",
  "stageHalo",
  "backHair",
  "bodyBase",
  "neck",
  "face",
  "ears",
  "eyes",
  "brows",
  "nose",
  "mouth",
  "blush",
  "frontHair",
  "sideHair",
  "bun",
  "innerRobe",
  "outerRobe",
  "sleeves",
  "pibo",
  "skirt",
  "belt",
  "embroidery",
  "shoes",
  "hairpin",
  "earrings",
  "tassels",
  "foregroundEffects"
] as const;

export type AvatarLayerId = (typeof avatarLayerIds)[number];

export const avatarMaterialPartIds = [
  "skin",
  "hair",
  "eyes",
  "innerRobe",
  "outerRobe",
  "sleeves",
  "pibo",
  "skirt",
  "belt",
  "shoes",
  "hairpin",
  "earrings",
  "necklace",
  "tassel",
  "jadePendant",
  "ornaments",
  "embroidery",
  "backgroundGlow",
  "stageHalo",
  "foregroundEffects"
] as const;

export type AvatarPartId = (typeof avatarMaterialPartIds)[number];

export interface AvatarPart {
  id: AvatarPartId;
  label: string;
  layer: AvatarLayerId;
  enabled: boolean;
  variant: string;
}

export const avatarPartDisplayNames: Record<AvatarPartId, string> = {
  skin: "皮肤",
  hair: "头发",
  eyes: "眼睛",
  innerRobe: "内衫",
  outerRobe: "外袍",
  sleeves: "宽袖",
  pibo: "披帛",
  skirt: "裙摆",
  belt: "腰带",
  shoes: "鞋子",
  hairpin: "发簪",
  earrings: "耳饰",
  necklace: "项链",
  tassel: "流苏",
  jadePendant: "玉佩",
  ornaments: "配饰",
  embroidery: "刺绣",
  backgroundGlow: "背景光",
  stageHalo: "舞台光环",
  foregroundEffects: "前景光效"
};

export const visibleMaterialPartIds = [
  "skin",
  "hair",
  "eyes",
  "innerRobe",
  "outerRobe",
  "sleeves",
  "pibo",
  "belt",
  "skirt",
  "shoes",
  "hairpin",
  "earrings",
  "embroidery",
  "backgroundGlow"
] as const satisfies readonly AvatarPartId[];
