export const characterAssetViews = [
  "fullbody",
  "halfbody",
  "bust",
  "avatar",
  "portrait"
] as const;

export type CharacterAssetView = (typeof characterAssetViews)[number];

export const characterPortraitIds = [
  "neutral",
  "smile",
  "thinking",
  "confused",
  "shy",
  "annoyed"
] as const;

export type CharacterPortraitId = (typeof characterPortraitIds)[number];

export interface CharacterStageAssets {
  fullbodyFront: string;
  halfbody?: string | undefined;
  transparentFullbody?: string | undefined;
  bust?: string | undefined;
}

export interface CharacterReferenceAssets {
  turnaroundSheet?: string | undefined;
  materialDetails?: string | undefined;
  actionStates?: string | undefined;
  front?: string | undefined;
  side?: string | undefined;
  back?: string | undefined;
  threeQuarter?: string | undefined;
}

export interface CharacterPortraitAssets {
  avatar?: string | undefined;
  expressionSheet?: string | undefined;
  neutral?: string | undefined;
  smile?: string | undefined;
  thinking?: string | undefined;
  confused?: string | undefined;
  shy?: string | undefined;
  annoyed?: string | undefined;
}

export interface CharacterThumbnailAssets {
  presetCard?: string | undefined;
}

export interface CharacterGeneratedAssets {
  contactSheet?: string | undefined;
  importReport?: string | undefined;
}

export interface CharacterAssetImportInfo {
  sourceDir: string;
  generatedAt: string;
  mappingConfidence: Record<string, number>;
  fallbackFrom?: Record<string, string> | undefined;
  missingAssets?: string[] | undefined;
}

export interface CharacterAssetManifest {
  id: string;
  displayName: string;
  description: string;
  styleTags: string[];
  assetRoot?: string | undefined;
  assets: {
    stage: CharacterStageAssets;
    reference?: CharacterReferenceAssets | undefined;
    portraits?: CharacterPortraitAssets | undefined;
    thumbnails?: CharacterThumbnailAssets | undefined;
    generated?: CharacterGeneratedAssets | undefined;
  };
  palette?: {
    skin: string;
    hair: string;
    innerCloth: string;
    outerCloth: string;
    scarf: string;
    belt: string;
    ornament: string;
    embroidery: string;
  };
  runtimeAssets?: {
    vrm?: string | undefined;
    glb?: string | undefined;
    live2dModelJson?: string | undefined;
    layeredPsd?: string | undefined;
  };
  credits?: {
    source: string;
    license: string;
    author?: string | undefined;
  };
  importInfo?: CharacterAssetImportInfo | undefined;
}

export interface CharacterAssetImportSlot {
  key: string;
  label: string;
  path: string;
  recommendedSize: string;
  purpose: string;
  required?: boolean | undefined;
}

export interface CharacterAssetCompletenessItem {
  key: string;
  label: string;
  manifestPath?: string | undefined;
  expectedPublicPath: string;
  required: boolean;
}
