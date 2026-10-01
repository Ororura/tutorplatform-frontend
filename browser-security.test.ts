// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import nextConfig from "./next.config";
import { applicationCsp } from "./browser-security";
import { proxy } from "./proxy";

afterEach(() => vi.unstubAllEnvs());

describe("production browser policy", () => {
  it("applies headers to every path only in production, without HTTP upgrades", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    const headers = Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["Permissions-Policy"]).toContain("clipboard-write=(self)");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    expect(headers["Content-Security-Policy"]).not.toContain("upgrade-insecure-requests");
    vi.stubEnv("NODE_ENV", "development");
    expect(await nextConfig.headers!()).toEqual([]);
  });

  it("restricts scripts, connections, embedding and capabilities to actual sources", () => {
    const csp = applicationCsp("test-nonce");
    const directives = Object.fromEntries(
      csp.split("; ").map((value) => {
        const [name, ...sources] = value.split(" ");
        return [name, sources];
      }),
    );
    expect(directives["script-src"]).toEqual(["'self'", "'nonce-test-nonce'"]);
    expect(directives["script-src-attr"]).toEqual(["'none'"]);
    expect(directives["connect-src"]).toEqual(["'self'"]);
    expect(directives["img-src"]).toEqual(["'self'", "blob:"]);
    expect(directives["font-src"]).toEqual(["'self'"]);
    for (const name of ["object-src", "frame-src", "frame-ancestors", "worker-src", "media-src"]) {
      expect(directives[name]).toEqual(["'none'"]);
    }
    expect(csp).not.toMatch(/\*|unsafe-eval|https?:/);
    expect(applicationCsp()).not.toContain("nonce-");
  });

  it("generates fresh 256-bit nonces and replaces forged request policies before rendering", () => {
    vi.stubEnv("NODE_ENV", "production");
    const request = new NextRequest("http://localhost/login", {
      headers: { "Content-Security-Policy": "script-src 'nonce-attacker'", "x-nonce": "attacker" },
    });
    const first = proxy(request);
    const second = proxy(request);
    const csp = first.headers.get("Content-Security-Policy")!;
    const nonce = /'nonce-([^']+)'/.exec(csp)![1];
    expect(Buffer.from(nonce, "base64")).toHaveLength(32);
    expect(second.headers.get("Content-Security-Policy")).not.toEqual(csp);
    expect(csp).not.toContain("attacker");
    expect(first.headers.get("x-middleware-request-content-security-policy")).toEqual(csp);
    expect(first.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("leaves development HMR/debugging without a production CSP", () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = proxy(new NextRequest("http://localhost/login"));
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
  });
});
