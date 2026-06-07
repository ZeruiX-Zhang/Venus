import { CompanionDemoApp, DesktopPet } from "@personal-character-agent/ui";

export function App() {
  // URL 带 ?pet=1 时只渲染桌宠视图（Tauri 独立透明窗口加载此模式）
  const isPet = new URLSearchParams(window.location.search).get("pet") === "1";
  if (isPet) {
    return <DesktopPet />;
  }
  return <CompanionDemoApp variant="desktop" />;
}
