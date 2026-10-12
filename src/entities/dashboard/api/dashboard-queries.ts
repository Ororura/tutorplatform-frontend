import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type TeacherDashboard = components["schemas"]["TeacherDashboardResponse"];
export type TeacherDashboardAttentionItem = components["schemas"]["AttentionItem"];

export type AttentionType = TeacherDashboardAttentionItem["type"];
export type AttentionPage = components["schemas"]["TeacherDashboardAttentionPageResponse"];
export type AttentionParams = { type?: AttentionType; studentId?: string; page?: number; size?: number };

export async function getTeacherAttention(params: AttentionParams): Promise<AttentionPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/dashboard/attention", {
    params: { query: params },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export async function getTeacherDashboard(): Promise<TeacherDashboard> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/dashboard");

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const dashboardQueries = {
  all: () => ["dashboard"] as const,
  attentionLists: () => [...dashboardQueries.all(), "attention"] as const,
  attention: (params: AttentionParams) =>
    queryOptions({
      queryKey: [...dashboardQueries.attentionLists(), params] as const,
      queryFn: () => getTeacherAttention(params),
    }),
  teacher: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), "teacher"] as const,
      queryFn: getTeacherDashboard,
    }),
};
