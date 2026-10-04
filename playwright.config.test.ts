// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("E2E mutation target protection", () => {
  it.each([
    "https://tutor.ororura.site",
    "https://demo.ororura.site",
    "https://example.com",
    "http://localhost.example.com",
    "http://localhost@remote.example.com",
    "http://user:password@127.0.0.1:3000",
    "file:///tmp/app.html",
    "not-a-url",
  ])("rejects %s before test collection", async (baseURL) => {
    vi.stubEnv("PLAYWRIGHT_BASE_URL", baseURL);
    await expect(import("./playwright.config")).rejects.toThrow();
  });

  it.each(["http://localhost:3000", "http://127.0.0.1:3300", "http://[::1]:3000"])(
    "allows loopback %s",
    async (baseURL) => {
      vi.stubEnv("PLAYWRIGHT_BASE_URL", baseURL);
      const { default: config } = await import("./playwright.config");
      expect(config.use?.baseURL).toBe(baseURL);
      expect(config.workers).toBe(1);
      expect(config.retries).toBe(0);
    },
  );
});
