import type { AvatarState } from "@personal-character-agent/shared";

export type EmotionLabel =
  | "neutral"
  | "joy"
  | "focus"
  | "uncertain"
  | "frustrated"
  | "tired"
  | "failure";

export class EmotionToAnimationMapper {
  private readonly defaults: Record<EmotionLabel, AvatarState> = {
    neutral: "idle",
    joy: "happy",
    focus: "thinking",
    uncertain: "confused",
    frustrated: "annoyed",
    tired: "sleepy",
    failure: "error"
  };

  mapEmotion(emotion: EmotionLabel): AvatarState {
    return this.defaults[emotion] ?? "idle";
  }
}
