import type { CSSProperties } from "react";
import { useMemo } from "react";
import {
  getPixelMood,
  type PixelPortrait
} from "./PixelPortrait";
import type { AvatarState } from "./types";

export interface PixelPortraitStageProps {
  portrait: PixelPortrait;
  state?: AvatarState;
  memoryActive?: boolean;
  safetyActive?: boolean;
  size?: "small" | "medium" | "large" | "stage" | "studio";
  /** Accessible label. */
  label?: string;
  /** Optional overlay badge in the corner, e.g. "夺舍·像素". */
  badge?: string;
  /** Optional caption under the grid. */
  caption?: string;
}

const sizeToPixels: Record<NonNullable<PixelPortraitStageProps["size"]>, number> = {
  small: 120,
  medium: 180,
  large: 240,
  stage: 320,
  studio: 260
};

/**
 * Render a grid of colored cells that feels like a Claude-Code block avatar.
 * The grid reacts to avatar state (pulse, tilt, accent ring) so it looks
 * alive on both the web stage and the desktop floating shell.
 */
export function PixelPortraitStage({
  portrait,
  state = "idle",
  memoryActive = false,
  safetyActive = false,
  size = "stage",
  label,
  badge,
  caption
}: PixelPortraitStageProps) {
  const mood = useMemo(
    () => getPixelMood(state, memoryActive, safetyActive),
    [state, memoryActive, safetyActive]
  );
  const pixelSize = sizeToPixels[size];

  const style = {
    "--pixel-grid-size": portrait.size.toString(),
    "--pixel-stage-size": `${pixelSize}px`,
    "--pixel-bg": portrait.palette.background,
    "--pixel-accent": portrait.palette.accent,
    "--pixel-ring": mood.ringColor ?? "transparent",
    "--pixel-pulse": mood.pulse.toFixed(2),
    "--pixel-tilt": `${mood.tilt.toFixed(2)}deg`,
    "--pixel-accent-level": mood.accentLevel.toFixed(2)
  } as CSSProperties;

  return (
    <figure
      aria-label={label ?? portrait.name}
      className={[
        "pca-pixel-stage",
        `pca-pixel-stage--${size}`,
        `pca-pixel-stage--state-${state}`,
        memoryActive ? "is-memory-active" : "",
        safetyActive ? "is-safety-active" : ""
      ].filter(Boolean).join(" ")}
      data-pixel-origin={portrait.origin}
      data-pixel-id={portrait.id}
      data-avatar-state={state}
      style={style}
    >
      {badge && <span className="pca-pixel-stage__badge">{badge}</span>}
      <div
        aria-hidden="true"
        className="pca-pixel-stage__grid"
        role="img"
        style={{
          gridTemplateColumns: `repeat(${portrait.size}, 1fr)`,
          gridTemplateRows: `repeat(${portrait.size}, 1fr)`
        }}
      >
        {portrait.cells.map((color, index) => (
          <span
            className={[
              "pca-pixel-stage__cell",
              color ? "" : "is-empty"
            ].filter(Boolean).join(" ")}
            key={index}
            style={color ? { background: color } : undefined}
          />
        ))}
      </div>
      <figcaption className="pca-pixel-stage__caption">
        <strong>{portrait.name}</strong>
        {caption ? <span>{caption}</span> : portrait.caption ? <span>{portrait.caption}</span> : null}
      </figcaption>
    </figure>
  );
}
