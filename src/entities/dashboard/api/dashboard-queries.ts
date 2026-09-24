import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type TeacherDashboard = components["schemas"]["TeacherDashboardResponse"];
export type TeacherDashboardAttentionItem = components["schemas"]["AttentionItem"];

export async function getTeacherDashboard(): Promise<TeacherDashboard> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/dashboard");

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const dashboardQueries = {
  all: () => ["dashboard"] as const,
  teacher: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), "teacher"] as const,
      queryFn: getTeacherDashboard,
    }),
};
