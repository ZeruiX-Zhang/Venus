import type { AvatarProfile, AvatarState } from "@personal-character-agent/shared";

export interface Placeholder2DAvatarProps {
  profile: AvatarProfile;
  state: AvatarState;
  size?: "small" | "medium" | "large";
}

const stateLabel: Record<AvatarState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  happy: "Happy",
  annoyed: "Annoyed",
  sleepy: "Sleepy",
  confused: "Confused",
  error: "Error",
  hidden: "Hidden",
  peeking: "Peeking",
  edge_sitting: "Edge sitting"
};

export function Placeholder2DAvatar({
  profile,
  state,
  size = "large"
}: Placeholder2DAvatarProps) {
  return (
    <div className={`pca-avatar pca-avatar--${size} pca-avatar--${state}`}>
      <div
        className="pca-avatar__halo"
        style={{
          background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})`
        }}
      />
      <div className="pca-avatar__body">
        <div
          className="pca-avatar__hair"
          style={{ backgroundColor: profile.primaryColor }}
        />
        <div className="pca-avatar__face">
          <div className="pca-avatar__eyes">
            <span />
            <span />
          </div>
          <div className="pca-avatar__mouth" />
        </div>
        <div
          className="pca-avatar__ribbon"
          style={{ backgroundColor: profile.accentColor }}
        />
      </div>
      <div className="pca-avatar__state">{stateLabel[state]}</div>
    </div>
  );
}
