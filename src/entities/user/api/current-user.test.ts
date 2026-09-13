import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getCurrentUser } from "./current-user";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

beforeEach(() => {
  getMock.mockReset();
});

describe("getCurrentUser", () => {
  it.each([
    ["TEACHER" as const, "teacher@tutor.local"],
    ["STUDENT" as const, "student@tutor.local"],
  ])("returns an authenticated %s from /auth/me", async (role, email) => {
    getMock.mockResolvedValue({
      data: { id: "00000000-0000-0000-0000-000000000001", email, displayName: "Demo", roles: [role] },
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await expect(getCurrentUser()).resolves.toMatchObject({ email, roles: [role] });
    expect(getMock).toHaveBeenCalledWith("/api/v1/auth/me");
  });

  it("maps an unauthenticated /auth/me response to null", async () => {
    getMock.mockResolvedValue({
      data: undefined,
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication is required",
        timestamp: new Date().toISOString(),
        traceId: "trace",
        details: [],
      },
      response: new Response(null, { status: 401 }),
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
