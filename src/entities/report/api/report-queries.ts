import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/generated/schema";

export type ProgressReportSummary = components["schemas"]["ProgressReportSummaryResponse"];
export type ProgressReportDetails = components["schemas"]["ProgressReportDetailsResponse"];
export type LearningPeriod = components["schemas"]["LearningPeriodResponse"];
export type ProgressReportsPage = components["schemas"]["ProgressReportPageResponse"];
export type ProgressReportsParams = NonNullable<operations["listProgressReports"]["parameters"]["query"]>;

export async function getProgressReports(params: ProgressReportsParams): Promise<ProgressReportsPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/reports", { params: { query: params } });

  if (error) throw new ApiClientError(response.status, error);

  return data;
}

export async function getLearningPeriods(studentId: string, studentProgramId: string): Promise<LearningPeriod[]> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/teacher/students/{studentId}/programs/{studentProgramId}/learning-periods",
    { params: { path: { studentId, studentProgramId } } },
  );

  if (error) throw new ApiClientError(response.status, error);

  return data;
}

export async function getProgressReport(reportId: string): Promise<ProgressReportDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/reports/{reportId}", {
    params: { path: { reportId } },
  });

  if (error) throw new ApiClientError(response.status, error);

  return data;
}

export const reportQueries = {
  all: () => ["progress-reports"] as const,
  lists: () => [...reportQueries.all(), "list"] as const,
  list: (params: ProgressReportsParams) =>
    queryOptions({
      queryKey: [...reportQueries.lists(), params] as const,
      queryFn: () => getProgressReports(params),
    }),
  detail: (reportId: string) =>
    queryOptions({
      queryKey: [...reportQueries.all(), "detail", reportId] as const,
      queryFn: () => getProgressReport(reportId),
    }),
  learningPeriods: (studentId: string, studentProgramId: string) =>
    queryOptions({
      queryKey: [...reportQueries.all(), "learning-periods", studentId, studentProgramId] as const,
      queryFn: () => getLearningPeriods(studentId, studentProgramId),
    }),
};
