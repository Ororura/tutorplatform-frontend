import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reportQueries, type ProgressReportDetails } from "@/entities/report";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CreateProgressReportRequest = components["schemas"]["CreateProgressReportRequest"];
export type UpdateProgressReportRequest = components["schemas"]["UpdateProgressReportRequest"];
export type PublishProgressReportRequest = components["schemas"]["PublishProgressReportRequest"];

async function createProgressReport(body: CreateProgressReportRequest): Promise<ProgressReportDetails> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/reports", { body });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function updateProgressReport(
  reportId: string,
  body: UpdateProgressReportRequest,
): Promise<ProgressReportDetails> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/reports/{reportId}", {
    params: { path: { reportId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function publishProgressReport(
  reportId: string,
  body: PublishProgressReportRequest,
): Promise<ProgressReportDetails> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/reports/{reportId}/publish", {
    params: { path: { reportId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

function useRefreshReportQueries() {
  const queryClient = useQueryClient();

  return async (report: ProgressReportDetails) => {
    queryClient.setQueryData(reportQueries.detail(report.id).queryKey, report);
    await queryClient.invalidateQueries({ queryKey: reportQueries.all() });
  };
}

export function useCreateProgressReportMutation() {
  const refresh = useRefreshReportQueries();
  return useMutation({
    mutationFn: createProgressReport,
    onSuccess: refresh,
  });
}

export function useUpdateProgressReportMutation(reportId: string) {
  const refresh = useRefreshReportQueries();
  return useMutation({
    mutationFn: (body: UpdateProgressReportRequest) => updateProgressReport(reportId, body),
    onSuccess: refresh,
  });
}

export function usePublishProgressReportMutation(reportId: string) {
  const refresh = useRefreshReportQueries();
  return useMutation({
    mutationFn: (body: PublishProgressReportRequest) => publishProgressReport(reportId, body),
    onSuccess: refresh,
  });
}
