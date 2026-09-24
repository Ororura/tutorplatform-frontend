import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reportShareQueries } from "@/entities/report-share";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CreatedReportShare = components["schemas"]["ReportShareCreatedResponse"];

async function createReportShare(reportId: string, expiresAt?: string): Promise<CreatedReportShare> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/reports/{reportId}/shares", {
    params: { path: { reportId } },
    body: expiresAt ? { expiresAt } : {},
  });

  if (error) throw new ApiClientError(response.status, error);

  return data;
}

export function useCreateReportShareMutation(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expiresAt?: string) => createReportShare(reportId, expiresAt),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportShareQueries.list(reportId).queryKey });
    },
  });
}
