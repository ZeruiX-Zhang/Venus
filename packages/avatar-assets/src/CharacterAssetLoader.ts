import type { AvatarState } from "@personal-character-agent/avatar-runtime";
import type {
  CharacterAssetManifest,
  CharacterAssetView,
  CharacterPortraitId
} from "./CharacterAssetManifest";
import { assertCharacterAssetManifest } from "./validators";

export interface CharacterAssetImageResolution {
  status: "local-image";
  view: CharacterAssetView;
  path: string;
  expectedPath: string;
  candidates: string[];
  label: string;
}

export interface CharacterAssetFallbackResolution {
  status: "procedural-fallback";
  view: CharacterAssetView;
  reason: string;
}

export type CharacterAssetResolution =
  | CharacterAssetImageResolution
  | CharacterAssetFallbackResolution;

export interface CharacterAssetResolutionRequest {
  view: CharacterAssetView;
  state?: AvatarState | undefined;
  portrait?: CharacterPortraitId | undefined;
}

export interface ManifestFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type ManifestFetch = (url: string) => Promise<ManifestFetchResponse>;

const externalPathPattern = /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:)/i;
const supportedImageExtensionPattern = /\.(webp|png|jpe?g)$/i;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, "");

const unique = (items: string[]): string[] => [...new Set(items)];

export const defaultAssetRootForManifest = (manifest: Pick<CharacterAssetManifest, "id">): string =>
  `/assets/characters/${manifest.id}`;

export const publicPathForCharacterAsset = (assetUrl: string): string => {
  if (assetUrl.startsWith("/assets/")) {
    return `public${assetUrl}`;
  }
  return assetUrl;
};

export const normalizeCharacterAssetRoot = (root: string): string => {
  const trimmed = trimTrailingSlash(root.trim());
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("/") || externalPathPattern.test(trimmed) ? trimmed : `/${trimmed}`;
};

export const resolveCharacterAssetPath = (
  manifest: CharacterAssetManifest,
  path: string,
  root = manifest.assetRoot ?? defaultAssetRootForManifest(manifest)
): string => {
  if (externalPathPattern.test(path) || path.startsWith("/")) {
    return path;
  }

  const normalizedRoot = normalizeCharacterAssetRoot(root);
  return `${trimTrailingSlash(normalizedRoot)}/${trimLeadingSlash(path)}`;
};

export const createImageFallbackCandidates = (path: string): string[] => {
  if (externalPathPattern.test(path) && !path.startsWith("/") && !supportedImageExtensionPattern.test(path)) {
    return [path];
  }

  const match = path.match(supportedImageExtensionPattern);
  if (!match) {
    return [path];
  }

  const base = path.slice(0, -match[0].length);
  const extension = match[1]?.toLowerCase();
  if (extension === "webp") {
    return unique([`${base}.webp`, `${base}.png`, `${base}.jpg`, `${base}.jpeg`]);
  }
  if (extension === "png") {
    return unique([`${base}.png`, `${base}.webp`, `${base}.jpg`, `${base}.jpeg`]);
  }
  if (extension === "jpg" || extension === "jpeg") {
    return unique([path, `${base}.webp`, `${base}.png`, `${base}.jpg`, `${base}.jpeg`]);
  }
  return [path];
};

export const portraitForAvatarState = (state: AvatarState = "idle"): CharacterPortraitId => {
  if (state === "speaking" || state === "happy") {
    return "smile";
  }
  if (state === "thinking" || state === "listening") {
    return "thinking";
  }
  if (state === "confused" || state === "error") {
    return "confused";
  }
  if (state === "annoyed") {
    return "annoyed";
  }
  if (state === "peeking") {
    return "shy";
  }
  return "neutral";
};

const pushIfString = (paths: string[], value: string | undefined): void => {
  if (value) {
    paths.push(value);
  }
};

const selectManifestImagePaths = (
  manifest: CharacterAssetManifest,
  request: CharacterAssetResolutionRequest
): string[] => {
  const paths: string[] = [];
  const stage = manifest.assets.stage;
  const portraits = manifest.assets.portraits;
  const thumbnails = manifest.assets.thumbnails;

  if (request.view === "fullbody") {
    pushIfString(paths, stage.fullbodyFront);
    pushIfString(paths, stage.transparentFullbody);
    return unique(paths);
  }
  if (request.view === "halfbody") {
    pushIfString(paths, stage.halfbody);
    pushIfString(paths, stage.fullbodyFront);
    return unique(paths);
  }
  if (request.view === "bust") {
    pushIfString(paths, stage.bust);
    pushIfString(paths, stage.halfbody);
    pushIfString(paths, stage.fullbodyFront);
    return unique(paths);
  }
  if (request.view === "avatar") {
    pushIfString(paths, portraits?.avatar);
    pushIfString(paths, thumbnails?.presetCard);
    return unique(paths);
  }

  const portraitId = request.portrait ?? portraitForAvatarState(request.state);
  pushIfString(paths, portraits?.[portraitId]);
  pushIfString(paths, portraits?.neutral);
  pushIfString(paths, portraits?.avatar);
  pushIfString(paths, stage.fullbodyFront);
  return unique(paths);
};

export function resolveCharacterAsset(
  manifest: CharacterAssetManifest | undefined,
  request: CharacterAssetResolutionRequest
): CharacterAssetResolution {
  if (!manifest) {
    return {
      status: "procedural-fallback",
      view: request.view,
      reason: "No character asset manifest was provided."
    };
  }

  const imagePaths = selectManifestImagePaths(manifest, request);
  if (imagePaths.length === 0) {
    return {
      status: "procedural-fallback",
      view: request.view,
      reason: `Manifest ${manifest.id} has no image configured for ${request.view}.`
    };
  }

  const resolvedPaths = imagePaths.map((path) => resolveCharacterAssetPath(manifest, path));
  const candidates = unique(resolvedPaths.flatMap(createImageFallbackCandidates));
  const primaryPath = candidates[0] ?? resolvedPaths[0] ?? "";

  return {
    status: "local-image",
    view: request.view,
    path: primaryPath,
    expectedPath: resolvedPaths[0] ?? primaryPath,
    candidates,
    label: `${manifest.displayName} ${request.view}`
  };
}

const manifestRootFromUrl = (url: string): string => {
  const cleanUrl = url.split(/[?#]/)[0] ?? url;
  return trimTrailingSlash(cleanUrl.replace(/\/manifest\.json$/i, ""));
};

export async function loadCharacterAssetManifest(
  manifestUrl: string,
  fetcher?: ManifestFetch
): Promise<CharacterAssetManifest> {
  const resolvedFetcher =
    fetcher ??
    (typeof fetch === "function"
      ? (fetch as unknown as ManifestFetch)
      : undefined);

  if (!resolvedFetcher) {
    throw new Error("No fetch implementation is available to load a character manifest.");
  }

  const response = await resolvedFetcher(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to load character manifest ${manifestUrl}: ${response.status}`);
  }

  const manifest = assertCharacterAssetManifest(await response.json());
  return {
    ...manifest,
    assetRoot: manifest.assetRoot ?? manifestRootFromUrl(manifestUrl)
  };
}
