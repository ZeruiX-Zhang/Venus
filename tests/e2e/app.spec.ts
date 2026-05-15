import { expect, test } from "@playwright/test";

const enableDeveloperMode = async (page: import("@playwright/test").Page) => {
  const toggle = page.getByLabel("开发者模式");
  await toggle.evaluate((node) => {
    const input = node as HTMLInputElement;
    if (!input.checked) {
      input.click();
    }
  });
  await expect(toggle).toBeChecked();
};

test("v0.4 product flows are reachable from the UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "玉璃清仪 舞台" })).toBeVisible();
  const stageAsset = page.locator(".pca-stage-card [data-character-asset-id='yuli-qingyi']").first();
  await expect(stageAsset).toHaveAttribute("data-render-source", /local-asset|pending-local-asset/);
  await expect(page.locator(".pca-stage-card .pca-layered-avatar")).toHaveCount(0);
  await expect(page.locator(".pca-brand__text")).toContainText("个人角色代理 v0.4");
  await expect(page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "设置" })).toBeVisible();

  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "设置" }).click();
  await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
  await expect(page.getByText("模型调用")).toBeVisible();
  await page.getByLabel("语言").selectOption("en");
  await expect(page.getByRole("button", { name: "Home" })).toBeVisible();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Language").selectOption("zh");
  await expect(page.getByRole("button", { name: "首页" })).toBeVisible();

  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "对话" }).click();
  await expect(page.locator(".pca-chat__header-avatar[data-character-asset-view='avatar']")).toHaveAttribute("data-render-source", "local-asset");
  await expect(page.locator(".pca-chat-character-card [data-character-asset-view='halfbody']")).toHaveAttribute("data-render-source", "local-asset");
  await page.getByLabel("消息", { exact: true }).fill("Please remember that I prefer concise answers.");
  await page.getByLabel("消息", { exact: true }).press("Enter");
  await expect(page.getByText("记忆审批队列")).toBeVisible();

  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "记忆" }).click();
  await expect(page.getByRole("heading", { name: "记忆技能", exact: true })).toBeVisible();
  await expect(page.getByText("用户偏好记忆").first()).toBeVisible();

  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "矩阵" }).click();
  await expect(page.getByRole("heading", { name: "人格矩阵" })).toBeVisible();
  await expect(page.getByText("zh").first()).toBeVisible();
  await enableDeveloperMode(page);
  const firstCoreName = page.getByLabel("核心名称").last();
  await firstCoreName.fill("Mira 中文测试核心");
  await expect(firstCoreName).toHaveValue("Mira 中文测试核心");

  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "导入" }).click();
  await page.getByRole("button", { name: "炼化", exact: true }).click();
  await expect(page.getByRole("button", { name: /璃央|外冷内软的守护者/ }).first()).toBeVisible();

  await enableDeveloperMode(page);
  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "安全" }).click();
  await page.getByRole("button", { name: "未成年人安全模式", exact: true }).click();
  await page.getByRole("button", { name: /运行过滤/ }).click();
  await expect(page.getByText("已拦截", { exact: true })).toBeVisible();

  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "语音" }).click();
  await page.getByLabel("语音预设").selectOption("voice_mock_stage");
  await page.getByRole("button", { name: /测试语音/ }).click();
  await expect(page.getByText("语音结果")).toBeVisible();

  await enableDeveloperMode(page);
  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "提供方" }).click();
  await page.getByRole("button", { name: /测试提供方/ }).click();
  await expect(page.getByText("最近测试结果")).toBeVisible();
});

test("Avatar Studio shows local character asset gallery and manifest preview", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "主导航" });
  await nav.getByRole("button", { name: "工坊" }).click();

  await expect(page.getByRole("heading", { name: "角色资产工坊" })).toBeVisible();
  const presetCard = page.locator(".pca-character-preset-card").first();
  await expect(presetCard).toContainText("玉璃清仪");
  await presetCard.click();
  await expect(page.getByText("已应用默认角色资产包：玉璃清仪")).toBeVisible();
  await expect(page.getByRole("heading", { name: "主展示图" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "四视图设定图" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "表情图集" })).toBeVisible();
  await expect(page.getByText("public/assets/characters/yuli-qingyi/stage/fullbody-front.png").first()).toBeVisible();
  await expect(page.getByText("preset-card.png").first()).toBeVisible();
  await expect(page.getByText("turnaround-sheet.png").first()).toBeVisible();
  await expect(page.getByText("资产导入检查").first()).toBeVisible();
  await expect(page.getByText("contact-sheet.png").first()).toBeVisible();
  await expect(page.getByText("import-report.json").first()).toBeVisible();
  await expect(page.getByText("资产完整度检查").first()).toBeVisible();

  await enableDeveloperMode(page);
  await expect(page.getByText("CharacterAssetManifest JSON")).toBeVisible();
  await expect(page.getByText('"id": "yuli-qingyi"').last()).toBeVisible();
  await expect(page.getByText('"fullbodyFront": "/assets/characters/yuli-qingyi/stage/fullbody-front.png"').last()).toBeVisible();
});
