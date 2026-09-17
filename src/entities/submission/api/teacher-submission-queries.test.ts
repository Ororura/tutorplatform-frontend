import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getTeacherStudentSubmissions, teacherSubmissionQueries } from "./teacher-submission-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: {
    GET: vi.fn(),
  },
}));

const getMock = vi.mocked(apiClient.GET);

describe("teacherSubmissionQueries", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("requests submissions for the selected student", async () => {
    getMock.mockResolvedValue({
      data: {
        items: [],
        page: 0,
        size: 100,
        totalElements: 0,
        totalPages: 0,
      } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await getTeacherStudentSubmissions("student-1");

    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/submissions", {
      params: {
        path: {
          studentId: "student-1",
        },
        query: {
          page: 0,
          size: 100,
        },
      },
    });
  });

  it("uses a teacher and student scoped query key", () => {
    expect(teacherSubmissionQueries.list("student-1").queryKey).toEqual(["teacher-submissions", "list", "student-1"]);
  });

  it("provides a key for invalidating all submission lists of one student", () => {
    expect(teacherSubmissionQueries.studentLists("student-1")).toEqual(["teacher-submissions", "list", "student-1"]);
  });
});
