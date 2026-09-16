import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { getStudentHomework, getStudentHomeworks, homeworkQueries } from "./homework-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));
const getMock = vi.mocked(apiClient.GET);

describe("homeworkQueries", () => {
  beforeEach(() => getMock.mockReset());
  it("includes student and list context in request and stable key", async () => {
    getMock.mockResolvedValue({
      data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
    await getStudentHomeworks("alex", { page: 0, status: "ASSIGNED", studentProgramId: "program-1" });
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/homeworks", {
      params: {
        path: { studentId: "alex" },
        query: { page: 0, status: "ASSIGNED", studentProgramId: "program-1" },
      },
    });
    expect(homeworkQueries.list("alex", { page: 0 }).queryKey).not.toEqual(
      homeworkQueries.list("maria", { page: 0 }).queryKey,
    );
  });
  it("uses student and homework ids for detail", async () => {
    getMock.mockResolvedValue({
      data: { id: "hw-1" } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
    await getStudentHomework("alex", "hw-1");
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/homeworks/{homeworkId}", {
      params: {
        path: {
          studentId: "alex",
          homeworkId: "hw-1",
        },
      },
    });
  });
});
