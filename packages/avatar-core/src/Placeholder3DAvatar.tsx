import type { AvatarProfile, AvatarState } from "@personal-character-agent/shared";

export interface Placeholder3DAvatarProps {
  profile: AvatarProfile;
  state: AvatarState;
}

export function Placeholder3DAvatar({
  profile,
  state
}: Placeholder3DAvatarProps) {
  return (
    <div className="pca-avatar3d" aria-label={`${profile.displayName} ${state}`}>
      <div
        className="pca-avatar3d__orb"
        style={{
          borderColor: profile.primaryColor,
          boxShadow: `0 18px 36px ${profile.accentColor}55`
        }}
      >
        <span>{state}</span>
      </div>
    </div>
  );
}
