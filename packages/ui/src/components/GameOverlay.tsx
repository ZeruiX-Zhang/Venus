// 用途：把「雅趣」小游戏（求签/飞花令）做成沉浸面上的可关闭浮层，从角色面唤起。
import { X } from "lucide-react";
import { GamesPanel } from "./GamesPanel";

export function GameOverlay({
  characterName,
  isZh = true,
  onClose
}: {
  characterName: string;
  isZh?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="pca-overlay" role="dialog" aria-modal="true">
      {/* 点背景关闭 */}
      <div className="pca-overlay__backdrop" onClick={onClose} />
      <div className="pca-overlay__panel">
        <button
          className="pca-overlay__close"
          onClick={onClose}
          aria-label={isZh ? "关闭" : "Close"}
          type="button"
        >
          <X size={18} />
        </button>
        <GamesPanel characterName={characterName} isZh={isZh} />
      </div>
    </div>
  );
}

export default GameOverlay;
