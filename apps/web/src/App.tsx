import { CompanionDemoApp, DesktopPet } from "@personal-character-agent/ui";

export function App() {
  // URL 带 ?pet=1 时只渲染桌宠视图（透明背景只显示模型）
  const isPet = new URLSearchParams(window.location.search).get("pet") === "1";
  if (isPet) {
    return <DesktopPet />;
  }
  return <CompanionDemoApp variant="web" />;
}
