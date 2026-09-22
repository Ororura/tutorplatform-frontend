import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type TeacherAssessment = components["schemas"]["TeacherAssessmentResponse"];

export async function getTeacherAssessment(studentId: string, sessionId: string): Promise<TeacherAssessment> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/teacher/students/{studentId}/sessions/{sessionId}/assessment",
    { params: { path: { studentId, sessionId } } },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const assessmentQueries = {
  all: () => ["assessments"] as const,
  details: () => [...assessmentQueries.all(), "detail"] as const,
  detail: (studentId: string, sessionId: string) =>
    queryOptions({
      queryKey: [...assessmentQueries.details(), studentId, sessionId] as const,
      queryFn: () => getTeacherAssessment(studentId, sessionId),
    }),
};
