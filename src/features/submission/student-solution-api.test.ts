import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { runStudentCode } from "@/features/execution/run-code";
import { submitCodeAnswer } from "@/features/submission/submit-code";
import { submitTextAnswer } from "@/features/submission/submit-text";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { POST: vi.fn() },
}));

const postMock = vi.mocked(apiClient.POST);

describe("student solution API", () => {
  beforeEach(() => postMock.mockReset());

  it("submits TEXT only through its dedicated endpoint and request shape", async () => {
    postMock.mockResolvedValue({
      data: { id: "submission-1", status: "NEEDS_REVIEW" } as never,
      error: undefined,
      response: new Response(),
    });

    await submitTextAnswer({ taskId: "task-text", homeworkItemId: "item-text", textAnswer: "Мой ответ" });

    expect(postMock).toHaveBeenCalledWith("/api/v1/student/tasks/{taskId}/submissions", {
      params: { path: { taskId: "task-text" } },
      body: { homeworkItemId: "item-text", textAnswer: "Мой ответ" },
    });
  });

  it("keeps CODE run and persisted CODE submit as distinct generated operations", async () => {
    postMock.mockResolvedValue({ data: { status: "PASSED" } as never, error: undefined, response: new Response() });

    await runStudentCode({ taskId: "task-code", homeworkItemId: "item-code", sourceCode: "print(1)" });
    await submitCodeAnswer({ taskId: "task-code", homeworkItemId: "item-code", sourceCode: "print(1)" });

    expect(postMock).toHaveBeenNthCalledWith(1, "/api/v1/student/tasks/{taskId}/run", {
      params: { path: { taskId: "task-code" } },
      body: { homeworkItemId: "item-code", sourceCode: "print(1)" },
    });
    expect(postMock).toHaveBeenNthCalledWith(2, "/api/v1/student/tasks/{taskId}/code-submissions", {
      params: { path: { taskId: "task-code" } },
      body: { homeworkItemId: "item-code", sourceCode: "print(1)" },
    });
  });
});
