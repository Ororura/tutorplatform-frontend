import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiTransport,
  getCsrfToken,
  resetCsrfToken,
  setUnauthorizedHandler,
} from "./http-client";

beforeEach(() => {
  resetCsrfToken();
  setUnauthorizedHandler(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiTransport", () => {
  it("sends a GET with credentials and without loading or attaching CSRF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiTransport(new Request("http://localhost/api/v1/auth/me"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.credentials).toBe("include");
    expect(request.headers.has("X-XSRF-TOKEN")).toBe(false);
  });

  it.each(["POST", "PATCH", "DELETE"] as const)(
    "gets and attaches a CSRF token for %s",
    async (method) => {
      const storageSpy = vi.spyOn(Storage.prototype, "setItem");
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ token: "csrf-token", headerName: "X-XSRF-TOKEN" }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetchMock);

      await apiTransport(
        new Request("http://localhost/api/v1/teacher/resource", { method }),
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/auth/csrf");
      const request = fetchMock.mock.calls[1]?.[0] as Request;
      expect(request.credentials).toBe("include");
      expect(request.headers.get("X-XSRF-TOKEN")).toBe("csrf-token");
      expect(storageSpy).not.toHaveBeenCalled();
    },
  );

  it("refreshes the CSRF token and retries once after CSRF_INVALID", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ token: "stale-token", headerName: "X-XSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(
        Response.json({ code: "CSRF_INVALID", message: "Invalid", details: [] }, { status: 403 }),
      )
      .mockResolvedValueOnce(
        Response.json({ token: "fresh-token", headerName: "X-XSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiTransport(
      new Request("http://localhost/api/v1/teacher/resource", { method: "POST" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    const retriedRequest = fetchMock.mock.calls[3]?.[0] as Request;
    expect(retriedRequest.headers.get("X-XSRF-TOKEN")).toBe("fresh-token");
  });

  it("does not retry an ordinary role-based 403", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ token: "csrf-token", headerName: "X-XSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(
        Response.json({ code: "ACCESS_DENIED", message: "Denied", details: [] }, { status: 403 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await apiTransport(
      new Request("http://localhost/api/v1/teacher/resource", { method: "DELETE" }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent CSRF initialization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ token: "csrf-token", headerName: "X-XSRF-TOKEN" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([getCsrfToken(), getCsrfToken()]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("loads a fresh token after a session-changing login", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ token: "anonymous-token", headerName: "X-XSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(Response.json({ id: "user-id", roles: ["TEACHER"] }))
      .mockResolvedValueOnce(
        Response.json({ token: "authenticated-token", headerName: "X-XSRF-TOKEN" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await apiTransport(
      new Request("http://localhost/api/v1/auth/login", { method: "POST" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    await expect(getCsrfToken()).resolves.toMatchObject({ token: "authenticated-token" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("notifies the app for an expired protected request but not auth discovery or login", async () => {
    const onUnauthorized = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ code: "AUTH_REQUIRED", message: "Required" }, { status: 401 }),
    );
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal("fetch", fetchMock);

    await apiTransport(new Request("http://localhost/api/v1/teacher/students"));
    await apiTransport(new Request("http://localhost/api/v1/auth/me"));
    await apiTransport(new Request("http://localhost/api/v1/auth/login", { method: "GET" }));

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
