import {
  getDefaultAvatarManifest,
  type AvatarManifest
} from "@personal-character-agent/avatar-model";
import type { AvatarState } from "@personal-character-agent/avatar-runtime";
import { Layered2DAvatar } from "@personal-character-agent/avatar-runtime/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  CharacterAssetManifest,
  CharacterAssetView,
  CharacterPortraitId
} from "./CharacterAssetManifest";
import {
  publicPathForCharacterAsset,
  resolveCharacterAsset
} from "./CharacterAssetLoader";

export interface CharacterAssetRendererProps {
  manifest?: CharacterAssetManifest | undefined;
  state: AvatarState;
  view?: CharacterAssetView;
  portrait?: CharacterPortraitId | undefined;
  size?: "small" | "medium" | "large" | "stage" | "studio" | "card";
  gaze?: { x: number; y: number };
  memoryActive?: boolean;
  safetyActive?: boolean;
  className?: string | undefined;
  label?: string | undefined;
  objectFit?: CSSProperties["objectFit"];
  loading?: "eager" | "lazy" | undefined;
  allowProceduralFallback?: boolean;
  proceduralFallbackManifest?: AvatarManifest;
  missingTitle?: string | undefined;
  missingBody?: string | undefined;
  textFallback?: string | undefined;
  onAssetStatusChange?: ((status: "loaded" | "missing", path: string) => void) | undefined;
}

const sizeToProceduralSize: Record<
  NonNullable<CharacterAssetRendererProps["size"]>,
  "small" | "medium" | "large" | "stage" | "studio"
> = {
  small: "small",
  medium: "medium",
  large: "large",
  stage: "stage",
  studio: "studio",
  card: "small"
};

export function CharacterAssetRenderer({
  manifest,
  state,
  view = "fullbody",
  portrait,
  size = "stage",
  gaze = { x: 0, y: 0 },
  memoryActive = false,
  safetyActive = false,
  className,
  label,
  objectFit = "contain",
  loading,
  allowProceduralFallback = true,
  proceduralFallbackManifest = getDefaultAvatarManifest(),
  missingTitle,
  missingBody,
  textFallback,
  onAssetStatusChange
}: CharacterAssetRendererProps) {
  const resolution = useMemo(
    () => resolveCharacterAsset(manifest, { view, state, portrait }),
    [manifest, portrait, state, view]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState<"loading" | "loaded" | "failed">("loading");

  useEffect(() => {
    setCandidateIndex(0);
    setImageStatus("loading");
  }, [resolution.status, resolution.status === "local-image" ? resolution.expectedPath : ""]);

  if (resolution.status === "procedural-fallback") {
    if (!allowProceduralFallback) {
      return (
        <MissingAssetState
          body={missingBody}
          className={className}
          expectedPath={undefined}
          manifest={manifest}
          reason={resolution.reason}
          size={size}
          textFallback={textFallback}
          title={missingTitle}
          view={view}
        />
      );
    }

    return (
      <div
        className={[
          "pca-character-asset",
          `pca-character-asset--${size}`,
          "pca-character-asset--procedural",
          className
        ].filter(Boolean).join(" ")}
        data-character-asset-id={manifest?.id ?? "procedural-fallback"}
        data-render-source="procedural-fallback"
      >
        <span className="pca-character-asset__fallback-badge">低保真 fallback</span>
        <Layered2DAvatar
          gaze={gaze}
          label={label ?? "Low-fidelity procedural avatar fallback"}
          manifest={proceduralFallbackManifest}
          memoryActive={memoryActive}
          safetyActive={safetyActive}
          size={sizeToProceduralSize[size]}
          state={state}
        />
      </div>
    );
  }

  const currentCandidate = resolution.candidates[candidateIndex] ?? resolution.path;
  const exhaustedCandidates = imageStatus === "failed";

  if (exhaustedCandidates) {
    return (
      <MissingAssetState
        body={missingBody}
        className={className}
        expectedPath={publicPathForCharacterAsset(resolution.expectedPath)}
        manifest={manifest}
        reason={`Missing local asset: ${resolution.expectedPath}`}
        size={size}
        textFallback={textFallback}
        title={missingTitle}
        view={view}
      />
    );
  }

  return (
    <figure
      aria-label={label ?? resolution.label}
      className={[
        "pca-character-asset",
        `pca-character-asset--${size}`,
        `pca-character-asset--${view}`,
        `pca-character-asset--state-${state}`,
        memoryActive ? "is-memory-active" : "",
        safetyActive ? "is-safety-active" : "",
        className
      ].filter(Boolean).join(" ")}
      data-asset-path={currentCandidate}
      data-character-asset-id={manifest?.id}
      data-character-asset-view={view}
      data-image-status={imageStatus}
      data-render-source="local-asset"
    >
      <div className="pca-character-asset__backlight" aria-hidden="true" />
      {imageStatus === "loading" && (
        <div className="pca-character-asset__skeleton" aria-hidden="true" />
      )}
      {(state === "thinking" || state === "listening") && (
        <div className="pca-character-asset__particles" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {memoryActive && (
        <div className="pca-character-asset__sparkles" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {safetyActive && <div className="pca-character-asset__shield" aria-hidden="true" />}
      <img
        alt={label ?? resolution.label}
        className="pca-character-asset__image"
        decoding="async"
        draggable={false}
        loading={loading ?? (size === "stage" ? "eager" : "lazy")}
        onError={() => {
          const nextIndex = candidateIndex + 1;
          if (nextIndex < resolution.candidates.length) {
            setCandidateIndex(nextIndex);
            setImageStatus("loading");
            return;
          }
          onAssetStatusChange?.("missing", resolution.expectedPath);
          setImageStatus("failed");
        }}
        onLoad={() => {
          setImageStatus("loaded");
          onAssetStatusChange?.("loaded", currentCandidate);
        }}
        src={currentCandidate}
        style={{ objectFit }}
      />
      <figcaption className="pca-character-asset__caption">
        <strong>{manifest?.displayName}</strong>
        <span>{view}</span>
      </figcaption>
    </figure>
  );
}

export function MissingAssetState({
  manifest,
  size,
  view,
  reason,
  className,
  title,
  body,
  expectedPath,
  textFallback
}: {
  manifest?: CharacterAssetManifest | undefined;
  size: NonNullable<CharacterAssetRendererProps["size"]>;
  view: CharacterAssetView;
  reason: string;
  className?: string | undefined;
  title?: string | undefined;
  body?: string | undefined;
  expectedPath?: string | undefined;
  textFallback?: string | undefined;
}) {
  const fallbackText = size === "small" && textFallback ? textFallback : undefined;
  const assetRoot = manifest?.assetRoot ?? `/assets/characters/${manifest?.id ?? "unknown"}`;
  const displayPath = expectedPath ?? publicPathForCharacterAsset(`${assetRoot}/${view}.png`);

  if (fallbackText) {
    return (
      <div
        aria-label={title ?? "Missing character avatar asset"}
        className={[
          "pca-character-asset",
          `pca-character-asset--${size}`,
          `pca-character-asset--${view}`,
          "pca-character-asset--text-fallback",
          className
        ].filter(Boolean).join(" ")}
        data-character-asset-id={manifest?.id ?? "missing"}
        data-character-asset-view={view}
        data-missing-reason={reason}
        data-render-source="text-fallback"
        role="img"
      >
        <span>{fallbackText}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        "pca-character-asset",
        `pca-character-asset--${size}`,
        `pca-character-asset--${view}`,
        "pca-character-asset--missing",
        className
      ].filter(Boolean).join(" ")}
      data-character-asset-id={manifest?.id ?? "missing"}
      data-character-asset-view={view}
      data-missing-reason={reason}
      data-render-source="pending-local-asset"
      role="status"
    >
      <div className="pca-character-asset__backlight" aria-hidden="true" />
      <div className="pca-character-asset__missing-panel">
        <strong>{title ?? "缺少角色资产"}</strong>
        <span>
          {body ??
            `请将 ${manifest?.displayName ?? "角色"} 的 ${view} 图片放入 ${displayPath}，页面会自动重试 WebP/PNG/JPG/JPEG。`}
        </span>
        <code>{displayPath}</code>
        <button
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              void navigator.clipboard.writeText(displayPath);
            }
          }}
          type="button"
        >
          复制路径
        </button>
      </div>
    </div>
  );
}
