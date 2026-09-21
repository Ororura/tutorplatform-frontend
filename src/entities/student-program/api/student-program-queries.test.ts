import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import {
  getCurrentStudentProgram,
  getCurrentStudentProgramTopic,
  getCurrentStudentPrograms,
  getStudentProgram,
  getStudentPrograms,
  studentProgramQueries,
} from "./student-program-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("studentProgramQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("uses studentId for the list request and cache key", async () => {
    getMock.mockResolvedValue({ data: [], error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getStudentPrograms("student-maria")).resolves.toEqual([]);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/programs", {
      params: { path: { studentId: "student-maria" } },
    });
    expect(studentProgramQueries.list("student-alex").queryKey).not.toEqual(
      studentProgramQueries.list("student-maria").queryKey,
    );
  });

  it("loads programs owned by the authenticated student", async () => {
    getMock.mockResolvedValue({ data: [], error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getCurrentStudentPrograms()).resolves.toEqual([]);
    expect(getMock).toHaveBeenCalledWith("/api/v1/student/programs");
    expect(studentProgramQueries.currentList().queryKey).toEqual(["student-programs", "list", "current-student"]);
  });

  it("loads program details owned by the authenticated student", async () => {
    const data = { id: "program-2" } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getCurrentStudentProgram("program-2")).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/student/programs/{studentProgramId}", {
      params: { path: { studentProgramId: "program-2" } },
    });
    expect(studentProgramQueries.currentDetail("program-2").queryKey).toEqual([
      "student-programs",
      "detail",
      "current-student",
      "program-2",
    ]);
  });

  it("loads a topic through the Student Topic API with an isolated cache key", async () => {
    const data = { id: "topic-7", materials: [] } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getCurrentStudentProgramTopic("program-2", "topic-7")).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/student/programs/{studentProgramId}/topics/{topicId}", {
      params: { path: { studentProgramId: "program-2", topicId: "topic-7" } },
    });
    expect(studentProgramQueries.currentTopic("program-2", "topic-7").queryKey).toEqual([
      "student-programs",
      "detail",
      "current-student",
      "program-2",
      "topic",
      "topic-7",
    ]);
  });

  it("uses both identifiers for the detail request and cache key", async () => {
    const data = { id: "program-2" } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await getStudentProgram("student-2", "program-2");
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/programs/{studentProgramId}", {
      params: { path: { studentId: "student-2", studentProgramId: "program-2" } },
    });
    expect(studentProgramQueries.detail("student-1", "program-2").queryKey).not.toEqual(
      studentProgramQueries.detail("student-2", "program-2").queryKey,
    );
  });
});
