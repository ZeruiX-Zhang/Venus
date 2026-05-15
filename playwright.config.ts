import { defineConfig, devices } from "@playwright/test";

process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "0";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5178",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "pnpm --filter @personal-character-agent/web dev -- --port 5178 --strictPort",
    url: "http://127.0.0.1:5178",
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
