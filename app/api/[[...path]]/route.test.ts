// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS } from "./route";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("BACKEND_INTERNAL_URL", "http://backend:8080");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("same-origin runtime API proxy", () => {
  it.each([
    ["GET", GET],
    ["POST", POST],
    ["PUT", PUT],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
    ["OPTIONS", OPTIONS],
  ] as const)("preserves methods, query, cookies/CSRF and streamed bodies", async (method, handler) => {
    const body = method === "GET" ? undefined : '{"sourceCode":"print(1)"}';
    const request = new Request("http://localhost:3000/api/v1/student/tasks/task/run?attempt=2", {
      method,
      body,
      headers: {
        Cookie: "TUTOR_SESSION=session",
        "X-XSRF-TOKEN": "csrf",
        "Content-Type": "application/json",
        Connection: "keep-alive, x-transport",
        "x-transport": "private",
        Host: "attacker.test",
      },
    });
    fetchMock.mockResolvedValue(
      new Response("ok", {
        status: 201,
        headers: { "Set-Cookie": "TUTOR_SESSION=rotated; Path=/; HttpOnly", "X-Trace-Id": "trace" },
      }),
    );
    const response = await handler(request);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://backend:8080/api/v1/student/tasks/task/run?attempt=2");
    expect(init?.method).toBe(method);
    const headers = new Headers(init?.headers);
    expect(headers.get("Cookie")).toBe("TUTOR_SESSION=session");
    expect(headers.get("X-XSRF-TOKEN")).toBe("csrf");
    expect(headers.get("x-forwarded-host")).toBe("localhost:3000");
    expect(headers.get("host")).toBeNull();
    expect(headers.get("x-transport")).toBeNull();
    if (body) expect(await new Response(init?.body).text()).toBe(body);
    expect(init?.redirect).toBe("manual");
    expect(init?.cache).toBe("no-store");
    expect(response.status).toBe(201);
    expect(response.headers.get("Set-Cookie")).toContain("TUTOR_SESSION=rotated");
    expect(response.headers.get("X-Trace-Id")).toBe("trace");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(await response.text()).toBe("ok");
  });

  it("preserves multiple cookies and binary download metadata, and overrides backend security headers", async () => {
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="report.pdf"',
      "Referrer-Policy": "unsafe-url",
      "Content-Security-Policy": "default-src *",
    });
    headers.append("Set-Cookie", "one=1; Path=/; HttpOnly");
    headers.append("Set-Cookie", "two=2; Path=/; HttpOnly");
    const bytes = new Uint8Array([37, 80, 68, 70, 0, 255]);
    fetchMock.mockResolvedValue(new Response(bytes, { headers }));
    const response = await GET(new Request("http://localhost/api/v1/public/reports/token/pdf"));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("report.pdf");
    expect(response.headers.getSetCookie()).toEqual(headers.getSetCookie());
    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("Content-Security-Policy")).not.toContain("*");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("streams multipart uploads without changing the boundary or bytes", async () => {
    const data = new FormData();
    data.set("file", new Blob([new Uint8Array([0, 255, 7])]), "image.png");
    const request = new Request("http://localhost/api/v1/teacher/materials", { method: "POST", body: data });
    const bytes = await request.clone().arrayBuffer();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect((await POST(request)).status).toBe(204);
    const init = fetchMock.mock.calls[0][1]!;
    expect(new Headers(init.headers).get("Content-Type")).toBe(request.headers.get("Content-Type"));
    expect(await new Response(init.body).arrayBuffer()).toEqual(bytes);
  });

  it("preserves redirects and HEAD/empty responses", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { Location: "/api/v1/download" } }));
    const redirect = await GET(new Request("http://localhost/api/v1/file"));
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("Location")).toBe("/api/v1/download");
    fetchMock.mockResolvedValue(new Response(null, { headers: { "Content-Length": "123" } }));
    const response = await HEAD(new Request("http://localhost/api/v1/file", { method: "HEAD" }));
    expect(response.body).toBeNull();
    expect(response.headers.get("Content-Length")).toBe("123");
  });

  it("adds headers to upstream errors and network failures without exposing internal addresses", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"code":"UNAUTHORIZED"}', { status: 401 }));
    const unauthorized = await GET(new Request("http://localhost/api/v1/auth/me"));
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("X-Content-Type-Options")).toBe("nosniff");
    fetchMock.mockRejectedValueOnce(new Error("connect backend:8080 failed"));
    const unavailable = await GET(new Request("http://localhost/api/v1/auth/me"));
    expect(unavailable.status).toBe(502);
    expect(unavailable.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(await unavailable.text()).toBe("Bad Gateway");
  });

  it("removes stale compression metadata after fetch decompression", async () => {
    fetchMock.mockResolvedValue(
      new Response("decoded", { headers: { "Content-Encoding": "gzip", "Content-Length": "80" } }),
    );
    const response = await GET(new Request("http://localhost/api/v1/file"));
    expect(response.headers.get("Content-Encoding")).toBeNull();
    expect(response.headers.get("Content-Length")).toBeNull();
    expect(await response.text()).toBe("decoded");
  });
});
