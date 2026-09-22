import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getCurrentStudentProgress, getTeacherStudentProgress, progressQueries } from "./progress-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("progressQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("requests progress for the selected student program", async () => {
    const data = { studentProgramId: "program-2", sessionsCount: 4 };
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getTeacherStudentProgress("student-1", "program-2")).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/progress", {
      params: {
        path: { studentId: "student-1" },
        query: { studentProgramId: "program-2" },
      },
    });
  });

  it("isolates cached progress by student and program", () => {
    expect(progressQueries.detail("student-1", "program-1").queryKey).toEqual([
      "progress",
      "student",
      "student-1",
      "program",
      "program-1",
    ]);
    expect(progressQueries.detail("student-1", "program-1").queryKey).not.toEqual(
      progressQueries.detail("student-1", "program-2").queryKey,
    );
    expect(progressQueries.detail("student-1", "program-1").queryKey).not.toEqual(
      progressQueries.detail("student-2", "program-1").queryKey,
    );
  });

  it("requests the current student's progress for the selected program", async () => {
    const data = { studentProgramId: "program-2", sessionsCount: 4 };
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getCurrentStudentProgress("program-2")).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/student/progress", {
      params: { query: { studentProgramId: "program-2" } },
    });
    expect(progressQueries.currentStudent("program-2").queryKey).toEqual([
      "progress",
      "current-student",
      "program",
      "program-2",
    ]);
  });
});
