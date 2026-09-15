import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { getTeacherTask, getTeacherTasks, taskQueries } from "./task-queries";

vi.mock("@/shared/api/client", () => ({ ApiClientError: class extends Error {}, apiClient: { GET: vi.fn() } }));
const getMock = vi.mocked(apiClient.GET);

describe("taskQueries", () => {
  beforeEach(() => getMock.mockReset());
  it("sends supported server filters and pagination and keeps them in the key", async () => {
    const data = { items: [], page: 1, size: 20, totalElements: 0, totalPages: 0 } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });
    const params = { page: 1, size: 20, subjectId: "subject-1", status: "ACTIVE" as const, difficulty: "HARD" as const };
    await getTeacherTasks(params);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/tasks", { params: { query: params } });
    expect(taskQueries.list(params).queryKey).not.toEqual(taskQueries.list({ page: 0 }).queryKey);
  });
  it("loads detail by task id", async () => {
    getMock.mockResolvedValue({ data: { id: "task-1" } as never, error: undefined, response: new Response(null, { status: 200 }) });
    await getTeacherTask("task-1");
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/tasks/{taskId}", { params: { path: { taskId: "task-1" } } });
  });
});
