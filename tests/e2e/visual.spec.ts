import { expect, test } from "@playwright/test";

const openNav = async (page: import("@playwright/test").Page, name: string) => {
  await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name }).click();
};

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

const waitForCharacterAssets = async (page: import("@playwright/test").Page) => {
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll("[data-character-asset-id='yuli-qingyi']"));
    const visibleNodes = nodes.filter((node) => node.getClientRects().length > 0);
    return visibleNodes.length > 0 && visibleNodes.every((node) => {
      const renderSource = node.getAttribute("data-render-source");
      const imageStatus = node.getAttribute("data-image-status");
      return renderSource !== "local-asset" || imageStatus === "loaded";
    });
  });
};

const stabilizeVisualSnapshot = async (page: import("@playwright/test").Page) => {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.scrollingElement?.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>(".pca-view, .pca-panel, .pca-chat__log").forEach((node) => {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    });
  });
  await page.locator(".pca-stage-card [data-character-asset-id='yuli-qingyi']").first().waitFor({ state: "visible" });
};

test.describe("v0.4 visual surfaces", () => {
  test("main web stage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pca-stage-card [data-character-asset-id='yuli-qingyi']").first()).toBeVisible();
    await expect(page.locator(".pca-stage-card .pca-layered-avatar")).toHaveCount(0);
    await waitForCharacterAssets(page);
    await expect(page.locator(".pca-stage-card [data-render-source='local-asset']").first()).toHaveAttribute("data-asset-path", /fullbody-front\.png$/);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("main-web-stage.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("chat with avatar thinking and speaking surface", async ({ page }) => {
    await page.goto("/");
    await openNav(page, "对话");
    await page.getByLabel("消息", { exact: true }).fill("Help me study a short plan for tonight.");
    await page.getByLabel("消息", { exact: true }).press("Enter");
    await expect(page.getByText(/整理成一个清晰的下一步/).first()).toBeVisible();
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("chat-avatar-speaking.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("memory dashboard", async ({ page }) => {
    await page.goto("/");
    await openNav(page, "记忆");
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("memory-dashboard.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("personality matrix", async ({ page }) => {
    await page.goto("/");
    await openNav(page, "矩阵");
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("personality-matrix.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("character asset workshop gallery", async ({ page }) => {
    await page.goto("/");
    await openNav(page, "工坊");
    await expect(page.getByRole("heading", { name: "角色资产工坊" })).toBeVisible();
    await expect(page.getByText("导入资产说明")).toBeVisible();
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("avatar-studio.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("novel import wizard", async ({ page }) => {
    await page.goto("/");
    await openNav(page, "导入");
    await page.getByRole("button", { name: "炼化", exact: true }).click();
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("novel-import-wizard.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("safety mode", async ({ page }) => {
    await page.goto("/");
    await enableDeveloperMode(page);
    await openNav(page, "安全");
    await page.getByRole("button", { name: "未成年人安全模式", exact: true }).click();
    await page.getByRole("button", { name: /运行过滤/ }).click();
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("safety-mode.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("settings language selector", async ({ page }) => {
    await page.goto("/");
    await openNav(page, "设置");
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("settings-language-selector.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });

  test("developer mode and provider panel", async ({ page }) => {
    await page.goto("/");
    await enableDeveloperMode(page);
    await openNav(page, "提供方");
    await page.getByRole("button", { name: /测试提供方/ }).click();
    await waitForCharacterAssets(page);
    await stabilizeVisualSnapshot(page);
    await expect(page).toHaveScreenshot("model-provider-panel.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 600
    });
  });
});
