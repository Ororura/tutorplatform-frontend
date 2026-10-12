import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type TeacherSubmission = components["schemas"]["TeacherSubmissionResponse"];
export type TeacherSubmissionPage = components["schemas"]["TeacherSubmissionPageResponse"];

export async function getTeacherStudentSubmissions(studentId: string): Promise<TeacherSubmissionPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/submissions", {
    params: {
      path: { studentId },
      query: {
        page: 0,
        size: 100,
      },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export async function getTeacherSubmission(studentId: string, submissionId: string): Promise<TeacherSubmission> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/teacher/students/{studentId}/submissions/{submissionId}",
    {
      params: { path: { studentId, submissionId } },
    },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const teacherSubmissionQueries = {
  all: () => ["teacher-submissions"] as const,

  details: (studentId: string) => [...teacherSubmissionQueries.all(), "detail", studentId] as const,
  detail: (studentId: string, submissionId: string) =>
    queryOptions({
      queryKey: [...teacherSubmissionQueries.details(studentId), submissionId] as const,
      queryFn: () => getTeacherSubmission(studentId, submissionId),
    }),
  lists: () => [...teacherSubmissionQueries.all(), "list"] as const,

  studentLists: (studentId: string) => [...teacherSubmissionQueries.lists(), studentId] as const,

  list: (studentId: string) =>
    queryOptions({
      queryKey: teacherSubmissionQueries.studentLists(studentId),
      queryFn: () => getTeacherStudentSubmissions(studentId),
    }),
};
