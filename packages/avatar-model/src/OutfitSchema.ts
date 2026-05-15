export const robeOptions = ["jade_inner", "moon_inner", "vermillion_inner", "ink_inner", "scholar_inner", "sakura_inner"] as const;
export type InnerRobeOption = (typeof robeOptions)[number];

export const outerRobeOptions = ["jade_outer", "moon_outer", "vermillion_outer", "ink_outer", "scholar_outer", "sakura_outer"] as const;
export type OuterRobeOption = (typeof outerRobeOptions)[number];

export const sleeveOptions = ["wide_cloud", "narrow_scholar", "ceremonial_drop", "layered"] as const;
export type SleeveOption = (typeof sleeveOptions)[number];

export const piboOptions = ["translucent_arc", "double_stream", "none", "short_cloud"] as const;
export type PiboOption = (typeof piboOptions)[number];

export const skirtOptions = ["flowing_panel", "moon_pleated", "ceremonial_train", "short_companion"] as const;
export type SkirtOption = (typeof skirtOptions)[number];

export const beltOptions = ["jade_sash", "gold_cord", "silver_sash", "ribbon"] as const;
export type BeltOption = (typeof beltOptions)[number];

export const shoeOptions = ["embroidered_flat", "jade_boot", "ceremony_shoe", "soft_slipper"] as const;
export type ShoeOption = (typeof shoeOptions)[number];

export interface OutfitSchema {
  innerRobe: InnerRobeOption;
  outerRobe: OuterRobeOption;
  sleeves: SleeveOption;
  pibo: PiboOption;
  skirt: SkirtOption;
  belt: BeltOption;
  shoes: ShoeOption;
  embroidery: number;
  fabricOpacity: number;
  fabricWeight: number;
}

export const defaultOutfitSchema: OutfitSchema = {
  innerRobe: "jade_inner",
  outerRobe: "jade_outer",
  sleeves: "wide_cloud",
  pibo: "translucent_arc",
  skirt: "flowing_panel",
  belt: "jade_sash",
  shoes: "embroidered_flat",
  embroidery: 62,
  fabricOpacity: 84,
  fabricWeight: 46
};
