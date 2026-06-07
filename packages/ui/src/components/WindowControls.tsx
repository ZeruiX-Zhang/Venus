// 用途：桌面端（Tauri）的窗口控制按钮（最小化 / 关闭）。
// 因为窗口设了 decorations:false（无系统标题栏），需要自己提供这些按钮。
// 在网页里（非 Tauri）自动隐藏。
import { Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 是否运行在 Tauri 桌面端
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function WindowControls({ showClose = true }: { showClose?: boolean }) {
  // 网页环境直接不渲染（没有原生窗口可控制）
  if (!isTauri) return null;

  const minimize = () => {
    void getCurrentWindow().minimize();
  };
  const close = () => {
    void getCurrentWindow().close();
  };

  return (
    <div className="pca-winctl">
      <button className="pca-winctl__btn" onClick={minimize} title="最小化" type="button">
        <Minus size={14} />
      </button>
      {showClose && (
        <button className="pca-winctl__btn pca-winctl__btn--close" onClick={close} title="关闭" type="button">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default WindowControls;
