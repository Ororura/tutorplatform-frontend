import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { assessmentQueries, getTeacherAssessment } from "./assessment-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));

describe("assessmentQueries", () => {
  beforeEach(() => vi.mocked(apiClient.GET).mockReset());

  it("loads an assessment with both path identifiers and isolates its cache key", async () => {
    const data = { id: "assessment-1" } as never;
    vi.mocked(apiClient.GET).mockResolvedValue({
      data,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });

    await expect(getTeacherAssessment("student-1", "session-1")).resolves.toBe(data);
    expect(apiClient.GET).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/sessions/{sessionId}/assessment", {
      params: { path: { studentId: "student-1", sessionId: "session-1" } },
    });
    expect(assessmentQueries.detail("student-1", "session-1").queryKey).not.toEqual(
      assessmentQueries.detail("student-1", "session-2").queryKey,
    );
  });
});
