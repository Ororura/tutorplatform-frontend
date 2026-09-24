import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

if (!localHostnames.has(new URL(baseURL).hostname)) {
  throw new Error(`Playwright E2E is restricted to a local test environment; received ${baseURL}`);
}

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
