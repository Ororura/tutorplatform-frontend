import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type ReportShare = components["schemas"]["ReportShareSummaryResponse"];
export type ReportShareStatus = components["schemas"]["ReportShareStatus"];

export async function getReportShares(reportId: string): Promise<ReportShare[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/reports/{reportId}/shares", {
    params: { path: { reportId } },
  });

  if (error) throw new ApiClientError(response.status, error);

  return data.items ?? [];
}

export const reportShareQueries = {
  all: () => ["report-shares"] as const,
  list: (reportId: string) =>
    queryOptions({
      queryKey: [...reportShareQueries.all(), reportId] as const,
      queryFn: () => getReportShares(reportId),
    }),
};
