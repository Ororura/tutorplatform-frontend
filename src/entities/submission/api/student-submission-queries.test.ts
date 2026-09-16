import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { getStudentTaskSubmissions, studentSubmissionQueries } from "./student-submission-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("studentSubmissionQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("uses one context-scoped history request for the task and homework item", async () => {
    getMock.mockResolvedValue({
      data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await getStudentTaskSubmissions("task-1", "item-1");

    expect(getMock).toHaveBeenCalledWith("/api/v1/student/tasks/{taskId}/submissions", {
      params: { path: { taskId: "task-1" }, query: { homeworkItemId: "item-1", page: 0, size: 20 } },
    });
    expect(studentSubmissionQueries.list("task-1", "item-1").queryKey).toEqual([
      "student-submissions",
      "list",
      "task-1",
      "item-1",
    ]);
  });
});
