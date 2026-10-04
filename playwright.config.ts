import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

const target = new URL(baseURL);
if (
  !localHostnames.has(target.hostname.replace(/^\[|\]$/g, "")) ||
  !["http:", "https:"].includes(target.protocol) ||
  target.username ||
  target.password
) {
  throw new Error("Playwright E2E is restricted to an HTTP(S) loopback test environment without URL credentials");
}

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
});
