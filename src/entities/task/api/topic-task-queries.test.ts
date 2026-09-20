import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { getTopicTasks, topicTaskQueries } from "./topic-task-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("topicTaskQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("loads attached tasks for the requested topic", async () => {
    const data = [] as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await getTopicTasks("topic-1");

    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/topics/{topicId}/tasks", {
      params: { path: { topicId: "topic-1" } },
    });
    expect(topicTaskQueries.list("topic-1").queryKey).toEqual(["topic-tasks", "topic-1"]);
  });
});
