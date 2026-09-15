import { queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/generated/schema";

export type HomeworkSummary = components["schemas"]["HomeworkSummaryResponse"];
export type HomeworkDetails = components["schemas"]["HomeworkDetailsResponse"];
export type HomeworkPage = components["schemas"]["HomeworkPageResponse"];
export type HomeworkStatus = HomeworkSummary["status"];
export type CreateHomeworkRequest = components["schemas"]["CreateHomeworkRequest"];
export type UpdateHomeworkRequest = components["schemas"]["UpdateHomeworkRequest"];
export type HomeworkListParams = NonNullable<operations["listHomeworks"]["parameters"]["query"]>;

export async function getStudentHomeworks(studentId: string, params: HomeworkListParams): Promise<HomeworkPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/homeworks", {
    params: { path: { studentId }, query: params },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export async function getStudentHomework(studentId: string, homeworkId: string): Promise<HomeworkDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/homeworks/{homeworkId}", {
    params: { path: { studentId, homeworkId } },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const homeworkQueries = {
  all: () => ["teacher-homework"] as const,
  studentLists: (studentId: string) => [...homeworkQueries.all(), "list", studentId] as const,
  list: (studentId: string, params: HomeworkListParams) => queryOptions({
    queryKey: [...homeworkQueries.studentLists(studentId), params] as const,
    queryFn: () => getStudentHomeworks(studentId, params),
  }),
  details: () => [...homeworkQueries.all(), "detail"] as const,
  detail: (studentId: string, homeworkId: string) => queryOptions({
    queryKey: [...homeworkQueries.details(), studentId, homeworkId] as const,
    queryFn: () => getStudentHomework(studentId, homeworkId),
  }),
};
