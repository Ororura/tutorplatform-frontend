import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { dashboardQueries, getTeacherDashboard } from "./dashboard-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("dashboardQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("loads the teacher dashboard through the aggregate endpoint", async () => {
    const data = {
      activeStudentsCount: 2,
      needsReviewSubmissionsCount: 1,
      overdueHomeworksCount: 0,
      completedLearningPeriodsWithoutPublishedReportCount: 1,
      attentionItems: [],
    } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getTeacherDashboard()).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledOnce();
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/dashboard");
  });

  it("provides a stable teacher dashboard query key", () => {
    expect(dashboardQueries.teacher().queryKey).toEqual(["dashboard", "teacher"]);
  });
});
