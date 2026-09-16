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
