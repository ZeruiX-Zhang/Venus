import type { CSSProperties } from "react";
import { avatarMotions } from "./avatarMotions";
import {
  avatarThemes,
  defaultAvatarTheme,
  stateTone,
  type AvatarTheme,
  type AvatarThemeId
} from "./avatarThemes";
import type { AvatarState } from "./types";

export interface ProceduralAnimeAvatarProps {
  state: AvatarState;
  themeId?: AvatarThemeId;
  theme?: AvatarTheme;
  size?: "small" | "medium" | "large" | "stage";
  gaze?: { x: number; y: number };
  speakingLevel?: number;
  memoryActive?: boolean;
  safetyActive?: boolean;
  compact?: boolean;
  label?: string;
}

export function ProceduralAnimeAvatar({
  state,
  themeId = "hanfu_jade",
  theme,
  size = "stage",
  gaze = { x: 0, y: 0 },
  speakingLevel = 0,
  memoryActive = false,
  safetyActive = false,
  compact = false,
  label = "Mira procedural anime avatar"
}: ProceduralAnimeAvatarProps) {
  const selectedTheme = theme ?? avatarThemes[themeId] ?? defaultAvatarTheme;
  const motion = avatarMotions[state];
  const rootStyle = {
    "--avatar-hair": selectedTheme.hair,
    "--avatar-hair-shadow": selectedTheme.hairShadow,
    "--avatar-accent": selectedTheme.accent,
    "--avatar-accent-soft": selectedTheme.accentSoft,
    "--avatar-outfit": selectedTheme.outfit,
    "--avatar-outfit-trim": selectedTheme.outfitTrim,
    "--avatar-eye": selectedTheme.eye,
    "--avatar-glow": selectedTheme.glow,
    "--avatar-stage": selectedTheme.stage,
    "--avatar-gaze-x": `${gaze.x}px`,
    "--avatar-gaze-y": `${gaze.y}px`,
    "--avatar-breathe": `${motion.breathingSeconds}s`,
    "--avatar-float": `${motion.floatPixels}px`,
    "--avatar-speech-level": speakingLevel.toFixed(2)
  } as CSSProperties;

  return (
    <figure
      aria-label={label}
      className={[
        "pca-procedural-avatar",
        `pca-procedural-avatar--${size}`,
        `pca-procedural-avatar--${state}`,
        `pca-procedural-avatar--${motion.expression}`,
        compact ? "pca-procedural-avatar--compact" : ""
      ].filter(Boolean).join(" ")}
      data-avatar-state={state}
      style={rootStyle}
    >
      <div className="pca-procedural-avatar__stage-light" />
      <div className="pca-procedural-avatar__ring" />
      {motion.particleLevel > 0 && (
        <div className={`pca-procedural-avatar__particles pca-procedural-avatar__particles--${motion.particleLevel}`} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      <div className="pca-procedural-avatar__body">
        <div className="pca-procedural-avatar__robe-back" />
        <div className="pca-procedural-avatar__back-hair" />
        <div className="pca-procedural-avatar__silk pca-procedural-avatar__silk--left" />
        <div className="pca-procedural-avatar__silk pca-procedural-avatar__silk--right" />
        <div className="pca-procedural-avatar__sleeve pca-procedural-avatar__sleeve--left" />
        <div className="pca-procedural-avatar__sleeve pca-procedural-avatar__sleeve--right" />
        <div className="pca-procedural-avatar__hand pca-procedural-avatar__hand--left" />
        <div className="pca-procedural-avatar__hand pca-procedural-avatar__hand--right" />
        <div className="pca-procedural-avatar__torso">
          <div className="pca-procedural-avatar__skirt" />
          <div className="pca-procedural-avatar__over-robe" />
          <div className="pca-procedural-avatar__collar" />
          <div className="pca-procedural-avatar__sash" />
          <div className="pca-procedural-avatar__bow" />
          <div className="pca-procedural-avatar__ornament-chain" />
          <div className="pca-procedural-avatar__embroidery pca-procedural-avatar__embroidery--bodice" />
          <div className="pca-procedural-avatar__embroidery pca-procedural-avatar__embroidery--skirt" />
          <div className="pca-procedural-avatar__tie" />
        </div>
        <div className="pca-procedural-avatar__neck" />
        <div className="pca-procedural-avatar__head">
          <div className="pca-procedural-avatar__hair-bun" />
          <div className="pca-procedural-avatar__hairpin" />
          <div className="pca-procedural-avatar__hair-ornaments" />
          <div className="pca-procedural-avatar__ribbon-tail pca-procedural-avatar__ribbon-tail--left" />
          <div className="pca-procedural-avatar__ribbon-tail pca-procedural-avatar__ribbon-tail--right" />
          <div className="pca-procedural-avatar__hair pca-procedural-avatar__hair--cap" />
          <div className="pca-procedural-avatar__hair pca-procedural-avatar__hair--left" />
          <div className="pca-procedural-avatar__hair pca-procedural-avatar__hair--right" />
          <div className="pca-procedural-avatar__hair pca-procedural-avatar__hair--bang-a" />
          <div className="pca-procedural-avatar__hair pca-procedural-avatar__hair--bang-b" />
          <div className="pca-procedural-avatar__face">
            <div className="pca-procedural-avatar__blush pca-procedural-avatar__blush--left" />
            <div className="pca-procedural-avatar__blush pca-procedural-avatar__blush--right" />
            <div className="pca-procedural-avatar__eyes">
              <span className="pca-procedural-avatar__eye pca-procedural-avatar__eye--left">
                <i />
              </span>
              <span className="pca-procedural-avatar__eye pca-procedural-avatar__eye--right">
                <i />
              </span>
            </div>
            <div className="pca-procedural-avatar__brows">
              <span />
              <span />
            </div>
            <div className="pca-procedural-avatar__mouth">
              <span />
            </div>
          </div>
          <div className="pca-procedural-avatar__ear pca-procedural-avatar__ear--left" />
          <div className="pca-procedural-avatar__ear pca-procedural-avatar__ear--right" />
          <div className="pca-procedural-avatar__earring pca-procedural-avatar__earring--left" />
          <div className="pca-procedural-avatar__earring pca-procedural-avatar__earring--right" />
        </div>
      </div>
      <div className="pca-procedural-avatar__indicators" aria-hidden="true">
        {memoryActive && <span className="pca-procedural-avatar__indicator pca-procedural-avatar__indicator--memory">Memory</span>}
        {safetyActive && <span className="pca-procedural-avatar__indicator pca-procedural-avatar__indicator--safety">Safe</span>}
      </div>
      <figcaption className="pca-procedural-avatar__caption">
        <strong>{stateTone[state]}</strong>
        <span>{selectedTheme.name}</span>
      </figcaption>
    </figure>
  );
}

export { Layered2DAvatar } from "./Layered2DAvatar";
export { PixelPortraitStage } from "./PixelPortraitStage";
export type { PixelPortraitStageProps } from "./PixelPortraitStage";
