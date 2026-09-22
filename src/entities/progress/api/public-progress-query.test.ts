import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getPublicCurrentProgress, publicProgressQueries } from "./public-progress-query";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("publicProgressQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("requests the parent-safe progress projection by token", async () => {
    const data = { sessionsCount: 4, totalLearningMinutes: 180 };
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getPublicCurrentProgress("share-token")).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/public/progress/{token}", {
      params: { path: { token: "share-token" } },
    });
    expect(publicProgressQueries.detail("share-token").queryKey).toEqual(["public-progress", "share-token"]);
    expect(publicProgressQueries.detail("share-token").retry).toBe(false);
  });
});
