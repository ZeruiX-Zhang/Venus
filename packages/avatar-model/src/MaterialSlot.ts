export const avatarMaterialKinds = [
  "silk",
  "gauze",
  "jade",
  "pearl",
  "gold",
  "silver",
  "cotton",
  "embroidered"
] as const;

export type AvatarMaterialKind = (typeof avatarMaterialKinds)[number];

export interface MaterialSlot {
  color: string;
  secondaryColor: string;
  material: AvatarMaterialKind;
  opacity: number;
  roughness: number;
  metallic: number;
  texture?: string;
  mask?: string;
  zIndex: number;
}

export const createMaterialSlot = (
  color: string,
  secondaryColor: string,
  material: AvatarMaterialKind,
  zIndex: number,
  options: Partial<Omit<MaterialSlot, "color" | "secondaryColor" | "material" | "zIndex">> = {}
): MaterialSlot => {
  const slot: MaterialSlot = {
    color,
    secondaryColor,
    material,
    opacity: options.opacity ?? 1,
    roughness: options.roughness ?? 0.42,
    metallic: options.metallic ?? 0,
    zIndex
  };

  if (options.texture) {
    slot.texture = options.texture;
  }
  if (options.mask) {
    slot.mask = options.mask;
  }

  return slot;
};
