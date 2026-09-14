import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getTopicMaterials, topicMaterialQueries } from "./material-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("topicMaterialQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("uses topicId for the request and query key", async () => {
    getMock.mockResolvedValue({ data: [], error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getTopicMaterials("topic-7")).resolves.toEqual([]);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/topics/{topicId}/materials", {
      params: { path: { topicId: "topic-7" } },
    });
    expect(topicMaterialQueries.list("topic-7").queryKey).toEqual(["topic-materials", "topic-7"]);
  });
});
