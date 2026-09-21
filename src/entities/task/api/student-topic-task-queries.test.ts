import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getStudentTopicTasks, studentTopicTaskQueries } from "./student-topic-task-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("studentTopicTaskQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("loads standalone practice tasks in the student program topic context", async () => {
    getMock.mockResolvedValue({ data: [], error: undefined, response: new Response(null, { status: 200 }) });

    await getStudentTopicTasks("program-1", "topic-1");

    expect(getMock).toHaveBeenCalledWith("/api/v1/student/programs/{studentProgramId}/topics/{topicId}/tasks", {
      params: { path: { studentProgramId: "program-1", topicId: "topic-1" } },
    });
    expect(studentTopicTaskQueries.list("program-1", "topic-1").queryKey).toEqual([
      "student-topic-tasks",
      "program-1",
      "topic-1",
    ]);
  });
});
