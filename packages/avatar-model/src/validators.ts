import {
  avatarMotionIds,
  avatarRendererKinds,
  avatarStyleKinds,
  backHairOptions,
  bunOptions,
  frontHairOptions,
  sideHairOptions,
  type AvatarManifest
} from "./AvatarManifest";
import { avatarMaterialPartIds, type AvatarPartId } from "./AvatarPart";
import { avatarPostures, avatarSilhouettes, type BodyShape } from "./BodyShape";
import {
  browStyleOptions,
  eyeShapeOptions,
  faceShapeOptions,
  makeupStyleOptions,
  mouthStyleOptions,
  noseStyleOptions,
  type FaceShape
} from "./FaceShape";
import { avatarMaterialKinds, type MaterialSlot } from "./MaterialSlot";
import {
  beltOptions,
  outerRobeOptions,
  piboOptions,
  robeOptions,
  shoeOptions,
  skirtOptions,
  sleeveOptions,
  type OutfitSchema
} from "./OutfitSchema";

export interface AvatarManifestValidationResult {
  ok: boolean;
  errors: string[];
}

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && !Array.isArray(input);

const isString = (input: unknown): input is string => typeof input === "string";

const isFiniteNumber = (input: unknown): input is number =>
  typeof input === "number" && Number.isFinite(input);

const inList = <T extends readonly string[]>(input: unknown, list: T): input is T[number] =>
  isString(input) && list.includes(input);

const isColorLike = (input: unknown): input is string =>
  isString(input) && (/^#[0-9a-f]{3,8}$/iu.test(input) || /^rgba?\(/iu.test(input));

const expectNumber = (
  value: unknown,
  path: string,
  errors: string[],
  min: number,
  max: number
): void => {
  if (!isFiniteNumber(value) || value < min || value > max) {
    errors.push(`${path} must be a number between ${min} and ${max}.`);
  }
};

const validateBody = (body: unknown, errors: string[]): void => {
  if (!isRecord(body)) {
    errors.push("body must be an object.");
    return;
  }
  expectNumber(body.height, "body.height", errors, 120, 220);
  expectNumber(body.headBodyRatio, "body.headBodyRatio", errors, 4.5, 9);
  expectNumber(body.shoulderWidth, "body.shoulderWidth", errors, 20, 70);
  expectNumber(body.waistWidth, "body.waistWidth", errors, 15, 60);
  expectNumber(body.armLength, "body.armLength", errors, 30, 80);
  expectNumber(body.legLength, "body.legLength", errors, 45, 120);
  if (!inList(body.posture, avatarPostures)) {
    errors.push("body.posture is invalid.");
  }
  if (!inList(body.silhouette, avatarSilhouettes)) {
    errors.push("body.silhouette is invalid.");
  }
};

const validateFace = (face: unknown, errors: string[]): void => {
  if (!isRecord(face)) {
    errors.push("face must be an object.");
    return;
  }
  if (!inList(face.faceShape, faceShapeOptions)) {
    errors.push("face.faceShape is invalid.");
  }
  expectNumber(face.faceWidth, "face.faceWidth", errors, 20, 80);
  expectNumber(face.jawSoftness, "face.jawSoftness", errors, 0, 100);
  expectNumber(face.cheekFullness, "face.cheekFullness", errors, 0, 100);
  expectNumber(face.chinLength, "face.chinLength", errors, 0, 100);
  if (!inList(face.eyeShape, eyeShapeOptions)) {
    errors.push("face.eyeShape is invalid.");
  }
  expectNumber(face.eyeSize, "face.eyeSize", errors, 10, 100);
  if (!isColorLike(face.eyeColor)) {
    errors.push("face.eyeColor must be a color.");
  }
  if (!inList(face.browStyle, browStyleOptions)) {
    errors.push("face.browStyle is invalid.");
  }
  if (!inList(face.noseStyle, noseStyleOptions)) {
    errors.push("face.noseStyle is invalid.");
  }
  if (!inList(face.mouthStyle, mouthStyleOptions)) {
    errors.push("face.mouthStyle is invalid.");
  }
  expectNumber(face.blush, "face.blush", errors, 0, 100);
  if (!inList(face.makeupStyle, makeupStyleOptions)) {
    errors.push("face.makeupStyle is invalid.");
  }
};

const validateHair = (hair: unknown, errors: string[]): void => {
  if (!isRecord(hair)) {
    errors.push("hair must be an object.");
    return;
  }
  if (!inList(hair.frontHair, frontHairOptions)) {
    errors.push("hair.frontHair is invalid.");
  }
  if (!inList(hair.sideHair, sideHairOptions)) {
    errors.push("hair.sideHair is invalid.");
  }
  if (!inList(hair.backHair, backHairOptions)) {
    errors.push("hair.backHair is invalid.");
  }
  if (!inList(hair.bun, bunOptions)) {
    errors.push("hair.bun is invalid.");
  }
  expectNumber(hair.hairLength, "hair.hairLength", errors, 0, 100);
  if (!isColorLike(hair.hairColor)) {
    errors.push("hair.hairColor must be a color.");
  }
  if (!isColorLike(hair.highlightColor)) {
    errors.push("hair.highlightColor must be a color.");
  }
  if (!Array.isArray(hair.hairAccessorySlots)) {
    errors.push("hair.hairAccessorySlots must be an array.");
  }
};

const validateOutfit = (outfit: unknown, errors: string[]): void => {
  if (!isRecord(outfit)) {
    errors.push("outfit must be an object.");
    return;
  }
  if (!inList(outfit.innerRobe, robeOptions)) {
    errors.push("outfit.innerRobe is invalid.");
  }
  if (!inList(outfit.outerRobe, outerRobeOptions)) {
    errors.push("outfit.outerRobe is invalid.");
  }
  if (!inList(outfit.sleeves, sleeveOptions)) {
    errors.push("outfit.sleeves is invalid.");
  }
  if (!inList(outfit.pibo, piboOptions)) {
    errors.push("outfit.pibo is invalid.");
  }
  if (!inList(outfit.skirt, skirtOptions)) {
    errors.push("outfit.skirt is invalid.");
  }
  if (!inList(outfit.belt, beltOptions)) {
    errors.push("outfit.belt is invalid.");
  }
  if (!inList(outfit.shoes, shoeOptions)) {
    errors.push("outfit.shoes is invalid.");
  }
  expectNumber(outfit.embroidery, "outfit.embroidery", errors, 0, 100);
  expectNumber(outfit.fabricOpacity, "outfit.fabricOpacity", errors, 0, 100);
  expectNumber(outfit.fabricWeight, "outfit.fabricWeight", errors, 0, 100);
};

const validateMaterialSlot = (slot: unknown, path: string, errors: string[]): void => {
  if (!isRecord(slot)) {
    errors.push(`${path} must be an object.`);
    return;
  }
  if (!isColorLike(slot.color)) {
    errors.push(`${path}.color must be a color.`);
  }
  if (!isColorLike(slot.secondaryColor)) {
    errors.push(`${path}.secondaryColor must be a color.`);
  }
  if (!inList(slot.material, avatarMaterialKinds)) {
    errors.push(`${path}.material is invalid.`);
  }
  expectNumber(slot.opacity, `${path}.opacity`, errors, 0, 1);
  expectNumber(slot.roughness, `${path}.roughness`, errors, 0, 1);
  expectNumber(slot.metallic, `${path}.metallic`, errors, 0, 1);
  expectNumber(slot.zIndex, `${path}.zIndex`, errors, -100, 200);
};

export const validateAvatarManifest = (input: unknown): AvatarManifestValidationResult => {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: ["manifest must be an object."] };
  }

  for (const key of ["id", "name", "description", "createdAt", "updatedAt"]) {
    if (!isString(input[key])) {
      errors.push(`${key} must be a string.`);
    }
  }
  if (!inList(input.renderer, avatarRendererKinds)) {
    errors.push("renderer is invalid.");
  }
  if (!inList(input.style, avatarStyleKinds)) {
    errors.push("style is invalid.");
  }

  validateBody(input.body, errors);
  validateFace(input.face, errors);
  validateHair(input.hair, errors);
  validateOutfit(input.outfit, errors);

  if (!isRecord(input.materials)) {
    errors.push("materials must be an object.");
  } else {
    for (const partId of avatarMaterialPartIds) {
      validateMaterialSlot(input.materials[partId], `materials.${partId}`, errors);
    }
  }

  if (!isRecord(input.motions)) {
    errors.push("motions must be an object.");
  } else {
    for (const motionId of avatarMotionIds) {
      if (!isRecord(input.motions[motionId])) {
        errors.push(`motions.${motionId} must be an object.`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
};

export const assertAvatarManifest = (input: unknown): AvatarManifest => {
  const result = validateAvatarManifest(input);
  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }
  return input as AvatarManifest;
};

export const exportAvatarManifest = (manifest: AvatarManifest): string =>
  JSON.stringify(manifest, null, 2);

export const importAvatarManifest = (json: string): AvatarManifest => {
  const parsed: unknown = JSON.parse(json);
  return assertAvatarManifest(parsed);
};

export const updateMaterialSlot = (
  manifest: AvatarManifest,
  partId: AvatarPartId,
  patch: Partial<MaterialSlot>
): AvatarManifest => ({
  ...manifest,
  materials: {
    ...manifest.materials,
    [partId]: {
      ...manifest.materials[partId],
      ...patch
    }
  },
  updatedAt: new Date().toISOString()
});

export const updatePartColor = (
  manifest: AvatarManifest,
  partId: AvatarPartId,
  color: string
): AvatarManifest => updateMaterialSlot(manifest, partId, { color });

export const updateBodyShape = (
  manifest: AvatarManifest,
  patch: Partial<BodyShape>
): AvatarManifest => ({
  ...manifest,
  body: { ...manifest.body, ...patch },
  updatedAt: new Date().toISOString()
});

export const updateFaceShape = (
  manifest: AvatarManifest,
  patch: Partial<FaceShape>
): AvatarManifest => ({
  ...manifest,
  face: { ...manifest.face, ...patch },
  updatedAt: new Date().toISOString()
});

export const updateOutfit = (
  manifest: AvatarManifest,
  patch: Partial<OutfitSchema>
): AvatarManifest => ({
  ...manifest,
  outfit: { ...manifest.outfit, ...patch },
  updatedAt: new Date().toISOString()
});
