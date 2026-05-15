import { defaultAccessorySchema, type AccessorySchema } from "./AccessorySchema";
import { type AvatarPartId, avatarMaterialPartIds } from "./AvatarPart";
import { defaultBodyShape, type BodyShape } from "./BodyShape";
import { defaultFaceShape, type FaceShape } from "./FaceShape";
import { defaultHairSchema, defaultMotions, type AvatarManifest, type HairSchema } from "./AvatarManifest";
import { createMaterialSlot, type MaterialSlot } from "./MaterialSlot";
import { defaultOutfitSchema, type OutfitSchema } from "./OutfitSchema";

const fixedDate = "2026-05-09T00:00:00.000Z";

export const cloneAvatarManifest = <T extends AvatarManifest>(manifest: T): T =>
  JSON.parse(JSON.stringify(manifest)) as T;

const createBaseMaterials = (): Record<AvatarPartId, MaterialSlot> => ({
  skin: createMaterialSlot("#f4d7c7", "#dfad99", "pearl", 40, { roughness: 0.52 }),
  hair: createMaterialSlot("#24201f", "#101010", "silk", 41, { roughness: 0.32 }),
  eyes: createMaterialSlot("#607c72", "#dceee8", "jade", 48, { roughness: 0.2 }),
  innerRobe: createMaterialSlot("#f7f1e4", "#d9e4d7", "silk", 18, { roughness: 0.34 }),
  outerRobe: createMaterialSlot("#c3d6c6", "#f4efe2", "silk", 24, { roughness: 0.36 }),
  sleeves: createMaterialSlot("#d4e3d8", "#f8f2e8", "silk", 23, { opacity: 0.9 }),
  pibo: createMaterialSlot("#dbeee6", "#f8fbf5", "gauze", 30, { opacity: 0.48, roughness: 0.2 }),
  skirt: createMaterialSlot("#b5c9b9", "#eef4ec", "silk", 19, { roughness: 0.38 }),
  belt: createMaterialSlot("#9db6a2", "#e7d7a0", "jade", 32, { roughness: 0.24 }),
  shoes: createMaterialSlot("#e9eee5", "#8ca090", "embroidered", 14, { roughness: 0.48 }),
  hairpin: createMaterialSlot("#d7efe2", "#c4a96d", "jade", 50, { roughness: 0.16 }),
  earrings: createMaterialSlot("#d8efe4", "#ffffff", "pearl", 49, { roughness: 0.12 }),
  necklace: createMaterialSlot("#f2ead7", "#d9be82", "gold", 34, { metallic: 0.62, roughness: 0.18 }),
  tassel: createMaterialSlot("#cadfcf", "#f4ead6", "silk", 46, { opacity: 0.86 }),
  jadePendant: createMaterialSlot("#bfe0cf", "#e5f5ee", "jade", 35, { roughness: 0.18 }),
  ornaments: createMaterialSlot("#f1e5c7", "#b9d5c2", "gold", 47, { metallic: 0.38 }),
  embroidery: createMaterialSlot("#d5bf82", "#ffffff", "embroidered", 45, { opacity: 0.72, roughness: 0.28 }),
  backgroundGlow: createMaterialSlot("#b9d7c5", "#f5ead1", "gauze", 0, { opacity: 0.62 }),
  stageHalo: createMaterialSlot("#e8dcc2", "#abcfc0", "pearl", 1, { opacity: 0.34 }),
  foregroundEffects: createMaterialSlot("#f1e6b8", "#bce8dc", "pearl", 60, { opacity: 0.5 })
});

const mergeMaterials = (
  overrides: Partial<Record<AvatarPartId, Partial<MaterialSlot>>>
): Record<AvatarPartId, MaterialSlot> => {
  const base = createBaseMaterials();
  for (const partId of avatarMaterialPartIds) {
    const override = overrides[partId];
    if (override) {
      base[partId] = { ...base[partId], ...override };
    }
  }
  return base;
};

const createPreset = (
  input: {
    id: string;
    name: string;
    description: string;
    body?: Partial<BodyShape>;
    face?: Partial<FaceShape>;
    hair?: Partial<HairSchema>;
    outfit?: Partial<OutfitSchema>;
    accessories?: Partial<AccessorySchema>;
    materials?: Partial<Record<AvatarPartId, Partial<MaterialSlot>>>;
    tags: string[];
  }
): AvatarManifest => ({
  id: input.id,
  name: input.name,
  description: input.description,
  renderer: "layered-2d",
  style: "guofeng",
  body: { ...defaultBodyShape, ...input.body },
  face: { ...defaultFaceShape, ...input.face },
  hair: { ...defaultHairSchema, ...input.hair },
  outfit: { ...defaultOutfitSchema, ...input.outfit },
  accessories: { ...defaultAccessorySchema, ...input.accessories },
  materials: mergeMaterials(input.materials ?? {}),
  motions: defaultMotions,
  tags: input.tags,
  createdAt: fixedDate,
  updatedAt: fixedDate
});

export const avatarPresetLibrary: AvatarManifest[] = [
  createPreset({
    id: "mira-yuli",
    name: "Mira · 玉璃",
    description: "玉白与浅青绿的温柔古风默认模型，半透明披帛、古风发髻、玉簪与耳饰。",
    body: { height: 168, headBodyRatio: 7.1, shoulderWidth: 40, waistWidth: 27, posture: "elegant", silhouette: "willow" },
    face: { faceShape: "oval", faceWidth: 48, jawSoftness: 78, cheekFullness: 60, chinLength: 46, eyeShape: "almond", eyeSize: 57, mouthStyle: "gentle", blush: 34 },
    hair: { frontHair: "soft_bangs", sideHair: "long_side_locks", backHair: "flowing_long", bun: "half_up", hairLength: 86, hairColor: "#24201f", highlightColor: "#7c8f82" },
    outfit: { innerRobe: "jade_inner", outerRobe: "jade_outer", sleeves: "wide_cloud", pibo: "translucent_arc", skirt: "flowing_panel", belt: "jade_sash", shoes: "embroidered_flat", embroidery: 62, fabricOpacity: 86, fabricWeight: 42 },
    accessories: { hairpin: "jade_pin", earrings: "jade_drop", necklace: "none", tassel: "short", jadePendant: "round_jade", ornaments: ["hair_ribbon", "stage_window"], backgroundStage: "jade_screen" },
    tags: ["default", "guofeng", "jade", "gentle"]
  }),
  createPreset({
    id: "mira-yuebai",
    name: "Mira · 月白",
    description: "月白与银灰的清冷安静模型，低饱和外袍、银簪与月窗舞台。",
    body: { height: 171, headBodyRatio: 7.25, shoulderWidth: 39, waistWidth: 26, posture: "reserved", silhouette: "willow" },
    face: { faceShape: "cool", faceWidth: 46, jawSoftness: 56, cheekFullness: 42, chinLength: 55, eyeShape: "cool", eyeSize: 52, eyeColor: "#7d909c", browStyle: "straight", mouthStyle: "calm", blush: 16, makeupStyle: "cool" },
    hair: { frontHair: "side_part", sideHair: "asymmetric", backHair: "cloud_long", bun: "low_bun", hairLength: 78, hairColor: "#272b31", highlightColor: "#8f98a6", hairAccessorySlots: ["hairpin"] },
    outfit: { innerRobe: "moon_inner", outerRobe: "moon_outer", sleeves: "layered", pibo: "short_cloud", skirt: "moon_pleated", belt: "silver_sash", shoes: "soft_slipper", embroidery: 34, fabricOpacity: 78, fabricWeight: 38 },
    accessories: { hairpin: "silver_pin", earrings: "pearl_drop", necklace: "pearl_chain", tassel: "none", jadePendant: "none", ornaments: ["stage_window"], backgroundStage: "moon_window" },
    materials: {
      outerRobe: { color: "#d9dee0", secondaryColor: "#f6f4ed", material: "silk" },
      pibo: { color: "#e7edf0", opacity: 0.38, material: "gauze" },
      belt: { color: "#c6ccd3", secondaryColor: "#ffffff", material: "silver", metallic: 0.46 },
      hairpin: { color: "#dfe5ea", material: "silver", metallic: 0.62 },
      backgroundGlow: { color: "#c9d4dc", secondaryColor: "#f2f4f0" },
      embroidery: { color: "#c7ced3", opacity: 0.46 }
    },
    tags: ["moon", "quiet", "silver"]
  }),
  createPreset({
    id: "mira-zhusha",
    name: "Mira · 朱砂",
    description: "朱砂红与暖金的典礼感模型，高髻、垂袖、金簪和仪式舞台。",
    body: { height: 169, headBodyRatio: 7, shoulderWidth: 43, waistWidth: 29, posture: "elegant", silhouette: "ceremonial" },
    face: { faceShape: "soft_v", faceWidth: 49, jawSoftness: 64, cheekFullness: 50, chinLength: 52, eyeShape: "phoenix", eyeSize: 55, eyeColor: "#7a3a2c", browStyle: "sharp", mouthStyle: "smile", blush: 42, makeupStyle: "ceremonial" },
    hair: { frontHair: "curtain_bangs", sideHair: "long_side_locks", backHair: "braided", bun: "high_bun", hairLength: 70, hairColor: "#1d1715", highlightColor: "#8e4d38", hairAccessorySlots: ["hairpin", "tassel"] },
    outfit: { innerRobe: "vermillion_inner", outerRobe: "vermillion_outer", sleeves: "ceremonial_drop", pibo: "double_stream", skirt: "ceremonial_train", belt: "gold_cord", shoes: "ceremony_shoe", embroidery: 88, fabricOpacity: 92, fabricWeight: 72 },
    accessories: { hairpin: "gold_pin", earrings: "gold_drop", necklace: "gold_choker", tassel: "long", jadePendant: "leaf_jade", ornaments: ["paper_fan"], backgroundStage: "red_ceremony" },
    materials: {
      innerRobe: { color: "#f8e1d1", secondaryColor: "#a84335" },
      outerRobe: { color: "#9e2f2b", secondaryColor: "#e4b56b", material: "embroidered" },
      sleeves: { color: "#b74436", secondaryColor: "#f0c37a", material: "embroidered" },
      skirt: { color: "#7f2626", secondaryColor: "#d9a452" },
      belt: { color: "#d7a95b", material: "gold", metallic: 0.68 },
      hairpin: { color: "#e1bd67", material: "gold", metallic: 0.72 },
      earrings: { color: "#e6c273", material: "gold", metallic: 0.66 },
      embroidery: { color: "#f0cb7a", opacity: 0.9 },
      backgroundGlow: { color: "#a43b32", secondaryColor: "#e5b86b" }
    },
    tags: ["ceremony", "vermillion", "gold"]
  }),
  createPreset({
    id: "mira-moyu",
    name: "Mira · 墨羽",
    description: "黑色与暗金/银的神秘冷静模型，深色外袍、利落侧发和低亮舞台。",
    body: { height: 172, headBodyRatio: 7.35, shoulderWidth: 42, waistWidth: 27, posture: "reserved", silhouette: "balanced" },
    face: { faceShape: "cool", faceWidth: 45, jawSoftness: 45, cheekFullness: 38, chinLength: 57, eyeShape: "phoenix", eyeSize: 51, eyeColor: "#8b927f", browStyle: "sharp", mouthStyle: "serious", blush: 8, makeupStyle: "cool" },
    hair: { frontHair: "side_part", sideHair: "asymmetric", backHair: "short_layered", bun: "none", hairLength: 56, hairColor: "#111317", highlightColor: "#565d65", hairAccessorySlots: ["hairpin"] },
    outfit: { innerRobe: "ink_inner", outerRobe: "ink_outer", sleeves: "narrow_scholar", pibo: "none", skirt: "moon_pleated", belt: "silver_sash", shoes: "jade_boot", embroidery: 48, fabricOpacity: 96, fabricWeight: 66 },
    accessories: { hairpin: "silver_pin", earrings: "none", necklace: "none", tassel: "short", jadePendant: "none", ornaments: ["none"], backgroundStage: "ink_stage" },
    materials: {
      innerRobe: { color: "#20242b", secondaryColor: "#6b7280", material: "cotton" },
      outerRobe: { color: "#111318", secondaryColor: "#8a7446", material: "embroidered" },
      sleeves: { color: "#161a20", secondaryColor: "#a4aab3" },
      skirt: { color: "#15171c", secondaryColor: "#4b5563" },
      belt: { color: "#87909b", material: "silver", metallic: 0.54 },
      hairpin: { color: "#a4aab3", material: "silver", metallic: 0.62 },
      embroidery: { color: "#9b7b45", opacity: 0.58 },
      backgroundGlow: { color: "#2f3441", secondaryColor: "#8a7446", opacity: 0.5 }
    },
    tags: ["ink", "quiet", "mysterious"]
  }),
  createPreset({
    id: "mira-tianqing",
    name: "Mira · 天青",
    description: "天青与青蓝的书卷气模型，书窗背景、窄袖外袍和纸扇配饰。",
    body: { height: 166, headBodyRatio: 7, shoulderWidth: 38, waistWidth: 27, posture: "relaxed", silhouette: "scholar" },
    face: { faceShape: "oval", faceWidth: 49, jawSoftness: 72, cheekFullness: 56, chinLength: 47, eyeShape: "round", eyeSize: 58, eyeColor: "#356b7c", browStyle: "soft_arch", mouthStyle: "gentle", blush: 24 },
    hair: { frontHair: "straight_bangs", sideHair: "short_side_locks", backHair: "cloud_long", bun: "low_bun", hairLength: 74, hairColor: "#1f2527", highlightColor: "#4e8b96", hairAccessorySlots: ["ribbon"] },
    outfit: { innerRobe: "scholar_inner", outerRobe: "scholar_outer", sleeves: "narrow_scholar", pibo: "short_cloud", skirt: "flowing_panel", belt: "ribbon", shoes: "soft_slipper", embroidery: 42, fabricOpacity: 82, fabricWeight: 40 },
    accessories: { hairpin: "none", earrings: "jade_drop", necklace: "none", tassel: "none", jadePendant: "round_jade", ornaments: ["paper_fan", "stage_window"], backgroundStage: "scholar_window" },
    materials: {
      innerRobe: { color: "#e8f4f2", secondaryColor: "#a8cfd4" },
      outerRobe: { color: "#8cc3ca", secondaryColor: "#eaf7f5", material: "silk" },
      sleeves: { color: "#9fd0d5", secondaryColor: "#f1fbfa" },
      pibo: { color: "#cae9e8", opacity: 0.42 },
      skirt: { color: "#74aeb8", secondaryColor: "#cfe9ec" },
      belt: { color: "#4f8792", secondaryColor: "#d4eceb" },
      earrings: { color: "#9bd0c7" },
      backgroundGlow: { color: "#83c9d2", secondaryColor: "#d8f1ee" }
    },
    tags: ["scholar", "cyan", "gentle"]
  }),
  createPreset({
    id: "mira-yingfen",
    name: "Mira · 樱粉",
    description: "桃粉与月白的亲和陪伴模型，柔和圆脸、双髻、短披帛和樱粉房间。",
    body: { height: 162, headBodyRatio: 6.85, shoulderWidth: 37, waistWidth: 28, posture: "playful", silhouette: "petite" },
    face: { faceShape: "round", faceWidth: 53, jawSoftness: 84, cheekFullness: 74, chinLength: 40, eyeShape: "round", eyeSize: 64, eyeColor: "#8a5967", browStyle: "soft_arch", mouthStyle: "smile", blush: 58, makeupStyle: "soft" },
    hair: { frontHair: "soft_bangs", sideHair: "short_side_locks", backHair: "flowing_long", bun: "double_bun", hairLength: 64, hairColor: "#3a2728", highlightColor: "#d89aad", hairAccessorySlots: ["ribbon", "flower"] },
    outfit: { innerRobe: "sakura_inner", outerRobe: "sakura_outer", sleeves: "wide_cloud", pibo: "short_cloud", skirt: "short_companion", belt: "ribbon", shoes: "soft_slipper", embroidery: 52, fabricOpacity: 80, fabricWeight: 34 },
    accessories: { hairpin: "flower_pin", earrings: "pearl_drop", necklace: "pearl_chain", tassel: "double", jadePendant: "none", ornaments: ["flower", "hair_ribbon"], backgroundStage: "sakura_room" },
    materials: {
      innerRobe: { color: "#fff1f4", secondaryColor: "#ffd7df" },
      outerRobe: { color: "#eaa9b8", secondaryColor: "#fff7f5" },
      sleeves: { color: "#f2bac7", secondaryColor: "#fff8f5" },
      pibo: { color: "#ffe2ea", opacity: 0.44 },
      skirt: { color: "#dd8fa3", secondaryColor: "#fff1f4" },
      belt: { color: "#b7657b", secondaryColor: "#ffe0e6" },
      hairpin: { color: "#f2c4cf", secondaryColor: "#d9a65f", material: "pearl" },
      earrings: { color: "#fff0f3", material: "pearl" },
      embroidery: { color: "#ffffff", secondaryColor: "#d9899e", opacity: 0.62 },
      backgroundGlow: { color: "#e9a7b8", secondaryColor: "#fff1f4" }
    },
    tags: ["sakura", "friendly", "companion"]
  })
];

export const getAvatarPreset = (id: string): AvatarManifest | undefined => {
  const preset = avatarPresetLibrary.find((candidate) => candidate.id === id);
  return preset ? cloneAvatarManifest(preset) : undefined;
};

export const getDefaultAvatarManifest = (): AvatarManifest => {
  const preset = getAvatarPreset("mira-yuli");
  if (!preset) {
    throw new Error("Default avatar preset is missing.");
  }
  return preset;
};
