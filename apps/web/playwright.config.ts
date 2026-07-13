import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @vetlog/api run dev",
      url: "http://localhost:3000/api/v1/health",
      cwd: "../..",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "pnpm exec vite",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
