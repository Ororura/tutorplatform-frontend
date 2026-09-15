import { queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type AttendanceStatus = components["schemas"]["LessonSessionSummaryResponse"]["attendanceStatus"];
export type LessonSessionSummary = components["schemas"]["LessonSessionSummaryResponse"];
export type LessonSessionDetails = components["schemas"]["LessonSessionDetailsResponse"];
export type LessonSessionPage = components["schemas"]["LessonSessionPageResponse"];
export type CreateLessonSessionRequest = components["schemas"]["CreateLessonSessionRequest"];
export type UpdateLessonSessionRequest = components["schemas"]["UpdateLessonSessionRequest"];

export type SessionListParams = {
  page: number;
  size?: number;
  sort?: string;
};

export async function getStudentSessions(studentId: string, params: SessionListParams): Promise<LessonSessionPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/sessions", {
    params: { path: { studentId }, query: params },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export async function getStudentSession(studentId: string, sessionId: string): Promise<LessonSessionDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/sessions/{sessionId}", {
    params: { path: { studentId, sessionId } },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const sessionQueries = {
  all: () => ["lesson-sessions"] as const,
  studentLists: (studentId: string) => [...sessionQueries.all(), "list", studentId] as const,
  list: (studentId: string, params: SessionListParams) => queryOptions({
    queryKey: [...sessionQueries.studentLists(studentId), params] as const,
    queryFn: () => getStudentSessions(studentId, params),
  }),
  details: () => [...sessionQueries.all(), "detail"] as const,
  detail: (studentId: string, sessionId: string) => queryOptions({
    queryKey: [...sessionQueries.details(), studentId, sessionId] as const,
    queryFn: () => getStudentSession(studentId, sessionId),
  }),
};
