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

  it("scopes practice history and its cache to the student program and topic", async () => {
    getMock.mockResolvedValue({
      data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never,
      error: undefined,
      response: new Response(),
    });
    const practice = { studentProgramId: "program-1", topicId: "topic-1" };
    await getStudentTaskSubmissions("task-1", undefined, practice);
    expect(getMock).toHaveBeenCalledWith("/api/v1/student/tasks/{taskId}/submissions", {
      params: { path: { taskId: "task-1" }, query: { ...practice, page: 0, size: 20 } },
    });
    expect(studentSubmissionQueries.list("task-1", undefined, practice).queryKey).not.toEqual(
      studentSubmissionQueries.list("task-1", undefined, { ...practice, studentProgramId: "program-2" }).queryKey,
    );
  });

  it("loads standalone attempts without adding a homework context", async () => {
    getMock.mockResolvedValue({
      data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await getStudentTaskSubmissions("task-1");

    expect(getMock).toHaveBeenCalledWith("/api/v1/student/tasks/{taskId}/submissions", {
      params: { path: { taskId: "task-1" }, query: { page: 0, size: 20 } },
    });
    expect(studentSubmissionQueries.list("task-1").queryKey).toEqual([
      "student-submissions",
      "list",
      "task-1",
      "standalone",
    ]);
  });
});
