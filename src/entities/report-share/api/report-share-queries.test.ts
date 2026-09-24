import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getReportShares, reportShareQueries } from "./report-share-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("reportShareQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("loads safe share history without expecting tokens or URLs", async () => {
    const items = [
      {
        id: "share-1",
        reportId: "report-1",
        status: "ACTIVE" as const,
        createdAt: "2026-09-24T10:00:00Z",
      },
    ];
    getMock.mockResolvedValue({ data: { items }, error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getReportShares("report-1")).resolves.toEqual(items);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/reports/{reportId}/shares", {
      params: { path: { reportId: "report-1" } },
    });
    expect(reportShareQueries.list("report-1").queryKey).toEqual(["report-shares", "report-1"]);
    expect(items[0]).not.toHaveProperty("shareUrl");
  });
});
