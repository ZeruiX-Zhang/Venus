// 用途：桌宠视图。独立于主程序的极简界面，在仙侠氛围中显示 3D 模型，
// 并像漫画人物一样随机弹出台词气泡。既能在浏览器里通过 ?pet=1 预览，
// 也能作为 Tauri 独立透明置顶窗口运行。
import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadCharacterAssetManifest,
  type CharacterAssetManifest
} from "@personal-character-agent/avatar-assets";
import { Stage3D } from "./Stage3D";
import { WindowControls } from "./WindowControls";
import { loadCustomModel } from "../lib/modelStorage";
import { pickRandomLine } from "../lib/petSpeech";

// 默认角色 manifest 路径（没有上传自定义模型时回退用）
const DEFAULT_MANIFEST_PATH = "/assets/characters/yuli-qingyi/manifest.json";

export function DesktopPet() {
  const [manifest, setManifest] = useState<CharacterAssetManifest | null>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  // 当前显示的台词（null = 不显示气泡）
  const [speech, setSpeech] = useState<string | null>(null);

  // 桌宠模式下让页面背景透明（Tauri 透明窗口需要 html/body 也透明）
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlBg: html.style.background, bodyBg: body.style.background, bodyOverflow: body.style.overflow };
    html.style.background = "transparent";
    body.style.background = "transparent";
    body.style.overflow = "hidden";
    return () => {
      html.style.background = prev.htmlBg;
      body.style.background = prev.bodyBg;
      body.style.overflow = prev.bodyOverflow;
    };
  }, []);

  // 加载默认 manifest（拿到角色基础信息和回退贴图）
  useEffect(() => {
    let cancelled = false;
    void loadCharacterAssetManifest(DEFAULT_MANIFEST_PATH)
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 从 IndexedDB 读用户上传的模型（和主程序共享同一份存储）
  useEffect(() => {
    let url: string | null = null;
    void loadCustomModel()
      .then((blob) => {
        if (blob) {
          url = URL.createObjectURL(blob);
          setCustomModelUrl(url);
        }
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  // 随机台词：每隔一段随机时间冒出一句，显示几秒后消失，循环往复
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let lastLine = "";
    const speakOnce = () => {
      const line = pickRandomLine(lastLine);
      lastLine = line;
      setSpeech(line);
      // 显示约 5.5 秒后收起
      timers.push(setTimeout(() => setSpeech(null), 5500));
      // 间隔 10~22 秒后再说下一句
      timers.push(setTimeout(speakOnce, 10000 + Math.random() * 12000));
    };
    // 首次 2.5 秒后开口
    timers.push(setTimeout(speakOnce, 2500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // 用上传模型覆盖 manifest 的 glb 字段
  const effectiveManifest = useMemo<CharacterAssetManifest | null>(() => {
    if (!manifest) return null;
    if (!customModelUrl) return manifest;
    return {
      ...manifest,
      runtimeAssets: { ...manifest.runtimeAssets, glb: customModelUrl }
    };
  }, [manifest, customModelUrl]);

  if (!effectiveManifest) {
    return <div className="pca-pet pca-pet--loading">凝形中…</div>;
  }

  return (
    <div className="pca-pet">
      {/* 古风夜色背景由 Stage3D 的 XianxiaBackdrop 提供（floating 模式渐隐边缘） */}

      {/* 窗口控制按钮（最小化/关闭），仅 Tauri 桌面端显示 */}
      <WindowControls />

      {/* 顶部拖动手柄：拖它移动整个桌宠窗口；模型区域用来旋转视角 */}
      <div className="pca-pet__handle" data-tauri-drag-region title="拖我移动桌宠">
        <span className="pca-pet__grip" />
      </div>

      {/* 漫画式台词气泡：随机出现在右上，带指向角色的小尾巴 */}
      {speech && (
        <div className="pca-pet__bubble" role="status">
          {speech}
        </div>
      )}

      <Stage3D
        bare
        manifest={effectiveManifest}
        state="idle"
        ariaLabel="桌宠"
      />
    </div>
  );
}

export default DesktopPet;
