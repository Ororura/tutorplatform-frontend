import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getLearningPeriods, getProgressReports, getPublicProgressReport, reportQueries } from "./report-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("reportQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("filters reports by StudentProgram and keeps that filter in the cache key", async () => {
    const data = { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getProgressReports({ studentProgramId: "program-1", sort: "periodEndedAt,desc" })).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/reports", {
      params: { query: { studentProgramId: "program-1", sort: "periodEndedAt,desc" } },
    });
    expect(reportQueries.list({ studentProgramId: "program-1" }).queryKey).not.toEqual(
      reportQueries.list({ studentProgramId: "program-2" }).queryKey,
    );
  });

  it("loads learning periods for the selected student program", async () => {
    getMock.mockResolvedValue({ data: [], error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getLearningPeriods("student-1", "program-1")).resolves.toEqual([]);
    expect(getMock).toHaveBeenCalledWith(
      "/api/v1/teacher/students/{studentId}/programs/{studentProgramId}/learning-periods",
      { params: { path: { studentId: "student-1", studentProgramId: "program-1" } } },
    );
  });

  it("loads a public historical report without retrying terminal share errors", async () => {
    const data = { periodStartedAt: "2026-09-01", periodEndedAt: "2026-09-30", snapshot: {} } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getPublicProgressReport("share-token")).resolves.toBe(data);
    expect(getMock).toHaveBeenCalledWith("/api/v1/public/reports/{token}", {
      params: { path: { token: "share-token" } },
    });
    expect(reportQueries.publicDetail("share-token").retry).toBe(false);
  });
});
