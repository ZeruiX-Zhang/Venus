export const hairpinOptions = ["jade_pin", "gold_pin", "silver_pin", "flower_pin", "none"] as const;
export type HairpinOption = (typeof hairpinOptions)[number];

export const earringOptions = ["pearl_drop", "jade_drop", "gold_drop", "none"] as const;
export type EarringOption = (typeof earringOptions)[number];

export const necklaceOptions = ["none", "jade_bead", "pearl_chain", "gold_choker"] as const;
export type NecklaceOption = (typeof necklaceOptions)[number];

export const tasselOptions = ["short", "long", "double", "none"] as const;
export type TasselOption = (typeof tasselOptions)[number];

export const jadePendantOptions = ["round_jade", "leaf_jade", "none"] as const;
export type JadePendantOption = (typeof jadePendantOptions)[number];

export const ornamentOptions = ["hair_ribbon", "stage_window", "paper_fan", "flower", "none"] as const;
export type OrnamentOption = (typeof ornamentOptions)[number];

export interface AccessorySchema {
  hairpin: HairpinOption;
  earrings: EarringOption;
  necklace: NecklaceOption;
  tassel: TasselOption;
  jadePendant: JadePendantOption;
  ornaments: OrnamentOption[];
  backgroundStage: "moon_window" | "jade_screen" | "red_ceremony" | "ink_stage" | "scholar_window" | "sakura_room";
}

export const defaultAccessorySchema: AccessorySchema = {
  hairpin: "jade_pin",
  earrings: "jade_drop",
  necklace: "none",
  tassel: "short",
  jadePendant: "round_jade",
  ornaments: ["hair_ribbon", "stage_window"],
  backgroundStage: "jade_screen"
};
