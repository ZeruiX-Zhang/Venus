import type {
  AvatarLayerId,
  AvatarManifest,
  AvatarMotionId,
  AvatarPartId,
  MaterialSlot
} from "@personal-character-agent/avatar-model";
import { getDefaultAvatarManifest } from "@personal-character-agent/avatar-model";
import type { CSSProperties, ReactNode } from "react";
import { avatarMotions } from "./avatarMotions";
import { stateTone } from "./avatarThemes";
import type { AvatarState } from "./types";

export interface Layered2DAvatarProps {
  manifest?: AvatarManifest;
  state: AvatarState;
  size?: "small" | "medium" | "large" | "stage" | "studio";
  gaze?: { x: number; y: number };
  speakingLevel?: number;
  memoryActive?: boolean;
  safetyActive?: boolean;
  compact?: boolean;
  label?: string;
}

const stateToMotion = (state: AvatarState): AvatarMotionId => {
  if (state === "thinking" || state === "listening") {
    return "confused";
  }
  if (state === "error") {
    return "annoyed";
  }
  if (state === "hidden") {
    return "sleepy";
  }
  if (state === "idle") {
    return "idle";
  }
  return state;
};

const normalize = (value: number, min: number, max: number): number =>
  Math.max(0, Math.min(1, (value - min) / (max - min)));

const postureTilt: Record<AvatarManifest["body"]["posture"], number> = {
  upright: 0,
  relaxed: -1,
  elegant: 1.5,
  reserved: -2,
  playful: 2
};

const materialStyle = (slot: MaterialSlot): CSSProperties =>
  ({
    "--slot-color": slot.color,
    "--slot-secondary": slot.secondaryColor,
    "--slot-opacity": slot.opacity,
    "--slot-roughness": slot.roughness,
    "--slot-metallic": slot.metallic,
    "--slot-z": slot.zIndex
  }) as CSSProperties;

export function Layered2DAvatar({
  manifest = getDefaultAvatarManifest(),
  state,
  size = "stage",
  gaze = { x: 0, y: 0 },
  speakingLevel = 0,
  memoryActive = false,
  safetyActive = false,
  compact = false,
  label
}: Layered2DAvatarProps) {
  const stateMotion = avatarMotions[state];
  const manifestMotion = manifest.motions[stateToMotion(state)];
  const faceWidth = 82 + (manifest.face.faceWidth - 50) * 0.36;
  const cheekFullness = 40 + manifest.face.cheekFullness * 0.22;
  const chinLength = 92 + (manifest.face.chinLength - 50) * 0.45;
  const shoulderScale = 0.9 + normalize(manifest.body.shoulderWidth, 30, 55) * 0.24;
  const waistScale = 0.84 + normalize(manifest.body.waistWidth, 20, 44) * 0.22;
  const heightScale = 0.92 + normalize(manifest.body.height, 150, 180) * 0.12;
  const hairLength = 34 + manifest.hair.hairLength * 0.46;
  const bunScale = manifest.hair.bun === "none" ? 0 : manifest.hair.bun === "double_bun" ? 0.84 : manifest.hair.bun === "high_bun" ? 1.08 : 0.92;
  const piboOpacity = Math.min(
    manifest.materials.pibo.opacity,
    manifest.outfit.fabricOpacity / 100
  );
  const rootStyle = {
    "--avatar-gaze-x": `${gaze.x}px`,
    "--avatar-gaze-y": `${gaze.y}px`,
    "--avatar-breathe": `${stateMotion.breathingSeconds}s`,
    "--avatar-float": `${stateMotion.floatPixels}px`,
    "--avatar-speech-level": speakingLevel.toFixed(2),
    "--avatar-face-width": `${faceWidth}%`,
    "--avatar-cheek-fullness": `${cheekFullness}%`,
    "--avatar-chin-length": `${chinLength}%`,
    "--avatar-eye-size": `${0.84 + manifest.face.eyeSize / 120}`,
    "--avatar-blush": manifest.face.blush / 100,
    "--avatar-shoulder-scale": shoulderScale,
    "--avatar-waist-scale": waistScale,
    "--avatar-height-scale": heightScale,
    "--avatar-arm-length": `${manifest.body.armLength}%`,
    "--avatar-leg-length": `${manifest.body.legLength}%`,
    "--avatar-posture-tilt": `${postureTilt[manifest.body.posture]}deg`,
    "--avatar-head-ratio": `${manifest.body.headBodyRatio}`,
    "--avatar-hair-length": `${hairLength}%`,
    "--avatar-bun-scale": bunScale,
    "--avatar-fabric-opacity": manifest.outfit.fabricOpacity / 100,
    "--avatar-fabric-weight": manifest.outfit.fabricWeight / 100,
    "--avatar-embroidery": manifest.outfit.embroidery / 100,
    "--avatar-pibo-opacity": piboOpacity
  } as CSSProperties;

  const layer = (
    id: AvatarLayerId,
    partId: AvatarPartId,
    children?: ReactNode,
    extraClass = ""
  ) => {
    const slot = manifest.materials[partId];
    return (
      <div
        className={[
          "pca-layered-avatar__layer",
          `pca-layered-avatar__${id}`,
          extraClass
        ].filter(Boolean).join(" ")}
        data-layer={id}
        data-material={slot.material}
        style={materialStyle(slot)}
      >
        {children}
      </div>
    );
  };

  return (
    <figure
      aria-label={label ?? `${manifest.name} layered avatar`}
      className={[
        "pca-layered-avatar",
        `pca-layered-avatar--${size}`,
        `pca-layered-avatar--state-${state}`,
        `pca-layered-avatar--motion-${manifestMotion.expression}`,
        `pca-layered-avatar--face-${manifest.face.faceShape}`,
        `pca-layered-avatar--eye-${manifest.face.eyeShape}`,
        `pca-layered-avatar--front-${manifest.hair.frontHair}`,
        `pca-layered-avatar--side-${manifest.hair.sideHair}`,
        `pca-layered-avatar--back-${manifest.hair.backHair}`,
        `pca-layered-avatar--bun-${manifest.hair.bun}`,
        `pca-layered-avatar--sleeves-${manifest.outfit.sleeves}`,
        `pca-layered-avatar--pibo-${manifest.outfit.pibo}`,
        `pca-layered-avatar--skirt-${manifest.outfit.skirt}`,
        compact ? "pca-layered-avatar--compact" : ""
      ].filter(Boolean).join(" ")}
      data-avatar-state={state}
      data-avatar-id={manifest.id}
      style={rootStyle}
    >
      {layer("backgroundGlow", "backgroundGlow")}
      {layer("stageHalo", "stageHalo")}
      <div className="pca-layered-avatar__body">
        {layer("backHair", "hair")}
        {layer("bodyBase", "skin")}
        {layer("shoes", "shoes")}
        {layer("skirt", "skirt", <span />)}
        {layer("innerRobe", "innerRobe", <span />)}
        {layer("outerRobe", "outerRobe", <span />)}
        {layer("sleeves", "sleeves", <><span /><span /></>)}
        {layer("pibo", "pibo", <><span /><span /></>)}
        {layer("belt", "belt", <><span /><i /></>)}
        {layer("embroidery", "embroidery", <><span /><span /><span /></>)}
        {layer("neck", "skin")}
        {layer("ears", "skin", <><span /><span /></>)}
        {layer("face", "skin")}
        {layer("blush", "skin", <><span /><span /></>)}
        {layer("eyes", "eyes", <><span><i /></span><span><i /></span></>)}
        {layer("brows", "hair", <><span /><span /></>)}
        {layer("nose", "skin", <span />)}
        {layer("mouth", "skin", <span />)}
        {layer("frontHair", "hair", <><span /><span /><span /></>)}
        {layer("sideHair", "hair", <><span /><span /></>)}
        {layer("bun", "hair", <><span /><span /></>)}
        {manifest.accessories.hairpin !== "none" && layer("hairpin", "hairpin", <><span /><i /></>)}
        {manifest.accessories.earrings !== "none" && layer("earrings", "earrings", <><span /><span /></>)}
        {manifest.accessories.tassel !== "none" && layer("tassels", "tassel", <><span /><span /></>)}
      </div>
      {layer("foregroundEffects", "foregroundEffects", <><span /><span /><span /></>)}
      <div className="pca-layered-avatar__indicators" aria-hidden="true">
        {memoryActive && <span>记忆</span>}
        {safetyActive && <span>安全</span>}
      </div>
      <figcaption className="pca-layered-avatar__caption">
        <strong>{manifest.name}</strong>
        <span>{stateTone[state]} / {manifestMotion.label}</span>
      </figcaption>
    </figure>
  );
}
