import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type ProgressShare = components["schemas"]["ProgressShareSummaryResponse"];
export type ProgressShareStatus = components["schemas"]["ProgressShareStatus"];

export async function getProgressShares(studentId: string, studentProgramId: string): Promise<ProgressShare[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/progress/shares", {
    params: {
      path: { studentId },
      query: { studentProgramId },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data.items;
}

export const progressShareQueries = {
  all: () => ["progress-shares"] as const,
  student: (studentId: string) => [...progressShareQueries.all(), "student", studentId] as const,
  list: (studentId: string, studentProgramId: string) =>
    queryOptions({
      queryKey: [...progressShareQueries.student(studentId), "program", studentProgramId] as const,
      queryFn: () => getProgressShares(studentId, studentProgramId),
    }),
};
