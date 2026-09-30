import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import {
  getCurrentStudentHomework,
  getCurrentStudentHomeworks,
  studentHomeworkQueries,
} from "./student-homework-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("studentHomeworkQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("loads the authenticated student's homework without a client supplied student id", async () => {
    getMock.mockResolvedValue({
      data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await getCurrentStudentHomeworks({ page: 0, size: 20, sort: "assignedAt,desc" });

    expect(getMock).toHaveBeenCalledWith("/api/v1/student/homeworks", {
      params: { query: { page: 0, size: 20, sort: "assignedAt,desc" } },
    });
    expect(studentHomeworkQueries.list({ page: 0 }).queryKey).toEqual(["student-homework", "list", { page: 0 }]);
  });

  it("keeps infinite pages separate by status and stops at the server totalPages boundary", () => {
    const active = studentHomeworkQueries.infiniteList({ status: "ASSIGNED", size: 20, sort: "dueAt,asc" });
    const history = studentHomeworkQueries.infiniteList({ status: "COMPLETED", size: 3, sort: "assignedAt,desc" });
    expect(active.queryKey).not.toEqual(history.queryKey);
    const page = { items: [], page: 0, size: 20, totalElements: 21, totalPages: 2 };
    expect(active.getNextPageParam!(page, [page], 0, [0])).toBe(1);
    expect(active.getNextPageParam!({ ...page, page: 1 }, [page], 1, [0, 1])).toBeUndefined();
    expect(active.getNextPageParam!({ ...page, totalPages: 0 }, [], 0, [0])).toBeUndefined();
  });

  it("loads detail only by owned homework id", async () => {
    getMock.mockResolvedValue({
      data: { id: "homework-1", items: [] } as never,
      error: undefined,
      response: new Response(),
    });

    await getCurrentStudentHomework("homework-1");

    expect(getMock).toHaveBeenCalledWith("/api/v1/student/homeworks/{homeworkId}", {
      params: { path: { homeworkId: "homework-1" } },
    });
  });
});
