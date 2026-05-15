import type { CharacterAssetManifest } from "./CharacterAssetManifest";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type CharacterAssetValidationResult =
  | { success: true; data: CharacterAssetManifest; issues: [] }
  | { success: false; issues: ValidationIssue[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const requireString = (
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: ValidationIssue[]
): void => {
  if (!isString(record[key])) {
    issues.push({ path, message: "Expected a non-empty string." });
  }
};

const optionalString = (
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: ValidationIssue[]
): void => {
  if (record[key] !== undefined && !isString(record[key])) {
    issues.push({ path, message: "Expected a non-empty string." });
  }
};

const optionalStringMap = (
  value: unknown,
  allowedKeys: readonly string[],
  path: string,
  issues: ValidationIssue[],
  requiredKeys: readonly string[] = []
): void => {
  if (value === undefined) {
    if (requiredKeys.length > 0) {
      issues.push({ path, message: "Expected an object." });
    }
    return;
  }
  if (!isRecord(value)) {
    issues.push({ path, message: "Expected an object." });
    return;
  }
  for (const key of requiredKeys) {
    requireString(value, key, `${path}.${key}`, issues);
  }
  for (const key of allowedKeys) {
    optionalString(value, key, `${path}.${key}`, issues);
  }
};

export function validateCharacterAssetManifest(
  value: unknown
): CharacterAssetValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      issues: [{ path: "$", message: "Expected a character asset manifest object." }]
    };
  }

  for (const key of ["id", "displayName", "description"] as const) {
    requireString(value, key, key, issues);
  }

  if (!isStringArray(value.styleTags)) {
    issues.push({ path: "styleTags", message: "Expected a string array." });
  }

  optionalString(value, "assetRoot", "assetRoot", issues);

  if (!isRecord(value.assets)) {
    issues.push({ path: "assets", message: "Expected an object." });
  } else {
    optionalStringMap(
      value.assets.stage,
      ["fullbodyFront", "halfbody", "transparentFullbody", "bust"],
      "assets.stage",
      issues,
      ["fullbodyFront"]
    );
    optionalStringMap(
      value.assets.reference,
      ["turnaroundSheet", "materialDetails", "actionStates", "front", "side", "back", "threeQuarter"],
      "assets.reference",
      issues
    );
    optionalStringMap(
      value.assets.portraits,
      ["avatar", "expressionSheet", "neutral", "smile", "thinking", "confused", "shy", "annoyed"],
      "assets.portraits",
      issues
    );
    optionalStringMap(
      value.assets.thumbnails,
      ["presetCard"],
      "assets.thumbnails",
      issues
    );
    optionalStringMap(
      value.assets.generated,
      ["contactSheet", "importReport"],
      "assets.generated",
      issues
    );
  }

  optionalStringMap(
    value.runtimeAssets,
    ["vrm", "live2dModelJson", "layeredPsd"],
    "runtimeAssets",
    issues
  );

  if (value.palette !== undefined) {
    optionalStringMap(
      value.palette,
      [
        "skin",
        "hair",
        "innerCloth",
        "outerCloth",
        "scarf",
        "belt",
        "ornament",
        "embroidery"
      ],
      "palette",
      issues,
      [
        "skin",
        "hair",
        "innerCloth",
        "outerCloth",
        "scarf",
        "belt",
        "ornament",
        "embroidery"
      ]
    );
  }

  if (value.credits !== undefined) {
    optionalStringMap(value.credits, ["source", "license", "author"], "credits", issues);
    if (isRecord(value.credits)) {
      if (!isString(value.credits.source)) {
        issues.push({ path: "credits.source", message: "Expected a non-empty string." });
      }
      if (!isString(value.credits.license)) {
        issues.push({ path: "credits.license", message: "Expected a non-empty string." });
      }
    }
  }

  if (value.importInfo !== undefined) {
    if (!isRecord(value.importInfo)) {
      issues.push({ path: "importInfo", message: "Expected an object." });
    } else {
      requireString(value.importInfo, "sourceDir", "importInfo.sourceDir", issues);
      requireString(value.importInfo, "generatedAt", "importInfo.generatedAt", issues);
      if (!isRecord(value.importInfo.mappingConfidence)) {
        issues.push({ path: "importInfo.mappingConfidence", message: "Expected an object." });
      } else {
        for (const [key, confidence] of Object.entries(value.importInfo.mappingConfidence)) {
          if (typeof confidence !== "number" || Number.isNaN(confidence)) {
            issues.push({
              path: `importInfo.mappingConfidence.${key}`,
              message: "Expected a numeric confidence value."
            });
          }
        }
      }
      if (value.importInfo.fallbackFrom !== undefined) {
        if (!isRecord(value.importInfo.fallbackFrom)) {
          issues.push({ path: "importInfo.fallbackFrom", message: "Expected an object." });
        } else {
          for (const [key, fallback] of Object.entries(value.importInfo.fallbackFrom)) {
            if (!isString(fallback)) {
              issues.push({
                path: `importInfo.fallbackFrom.${key}`,
                message: "Expected a non-empty string."
              });
            }
          }
        }
      }
      if (value.importInfo.missingAssets !== undefined && !isStringArray(value.importInfo.missingAssets)) {
        issues.push({ path: "importInfo.missingAssets", message: "Expected a string array." });
      }
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return { success: true, data: value as unknown as CharacterAssetManifest, issues: [] };
}

export function assertCharacterAssetManifest(value: unknown): CharacterAssetManifest {
  const result = validateCharacterAssetManifest(value);
  if (!result.success) {
    throw new Error(
      `Invalid CharacterAssetManifest: ${result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`
    );
  }
  return result.data;
}
