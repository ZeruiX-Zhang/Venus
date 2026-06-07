// 用途：以角色为中心的「沉浸陪伴面」。全屏 3D 角色 + 头顶气泡对话 +
// 底部轻量输入 + 悬浮快捷键（表情/雅趣）。对话、表情、点击身体反应都在角色身上进行。
import { Send, Dices } from "lucide-react";
import { Stage3D } from "./Stage3D";
import type { CharacterAssetManifest } from "@personal-character-agent/avatar-assets";
import type { AvatarState } from "@personal-character-agent/avatar-runtime";
import { characterEmotes, type CharacterEmote } from "../interactions/characterEmotes";

export function CompanionSurface({
  manifest,
  avatarState,
  memoryActive,
  safetyActive,
  bubbleText,
  draftMessage,
  thinking = false,
  isZh = true,
  onChangeDraft,
  onSend,
  onTriggerEmote,
  onOpenGames
}: {
  manifest: CharacterAssetManifest;
  avatarState: AvatarState;
  memoryActive: boolean;
  safetyActive: boolean;
  /** 当前要显示在角色身边的话（表情台词优先，否则她最近一句回复） */
  bubbleText?: string;
  draftMessage: string;
  thinking?: boolean;
  isZh?: boolean;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onTriggerEmote: (emote: CharacterEmote) => void;
  onOpenGames: () => void;
}) {
  return (
    <div className="pca-surface">
      {/* 全屏角色（含古风背景/前景雾气/点击身体反应/表情动画） */}
      <div className="pca-surface__stage">
        <Stage3D
          ariaLabel={isZh ? `${manifest.displayName} 沉浸舞台` : `${manifest.displayName} stage`}
          manifest={manifest}
          memoryActive={memoryActive}
          safetyActive={safetyActive}
          state={avatarState}
        />
      </div>

      {/* 她的话：头顶气泡 */}
      <div className={`pca-surface__bubble ${bubbleText ? "is-active" : ""}`}>
        {thinking ? (isZh ? "（凝神思量…）" : "(thinking…)") : bubbleText}
      </div>

      {/* 悬浮快捷键：表情 + 雅趣 */}
      <div className="pca-surface__quick" role="toolbar" aria-label={isZh ? "快捷互动" : "Quick actions"}>
        {characterEmotes.map((emote) => (
          <button
            className="pca-surface__quick-btn"
            key={emote.id}
            onClick={() => onTriggerEmote(emote)}
            title={emote.label[isZh ? "zh" : "en"]}
            type="button"
          >
            <span aria-hidden="true">{emote.emoji}</span>
          </button>
        ))}
        <button
          className="pca-surface__quick-btn pca-surface__quick-btn--games"
          onClick={onOpenGames}
          title={isZh ? "雅趣（求签 / 飞花令）" : "Play (fortune / poem duel)"}
          type="button"
        >
          <Dices size={18} />
        </button>
      </div>

      {/* 底部轻量输入栏 */}
      <form
        className="pca-surface__composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          className="pca-surface__input"
          onChange={(event) => onChangeDraft(event.target.value)}
          placeholder={isZh ? `与${manifest.displayName}说点什么…` : `Say something to ${manifest.displayName}…`}
          value={draftMessage}
        />
        <button className="pca-surface__send" type="submit" aria-label={isZh ? "发送" : "Send"}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default CompanionSurface;
