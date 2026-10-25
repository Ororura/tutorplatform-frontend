import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type TeacherSubmission = components["schemas"]["TeacherSubmissionResponse"];
export type TeacherSubmissionPage = components["schemas"]["TeacherSubmissionPageResponse"];

export async function getTeacherStudentSubmissions(
  studentId: string,
  page = 0,
  status?: TeacherSubmission["status"],
): Promise<TeacherSubmissionPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/submissions", {
    params: {
      path: { studentId },
      query: {
        page,
        ...(status ? { status } : {}),
        size: 100,
      },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

async function getTeacherSubmission(studentId: string, submissionId: string): Promise<TeacherSubmission> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/teacher/students/{studentId}/submissions/{submissionId}",
    { params: { path: { studentId, submissionId } } },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const teacherSubmissionQueries = {
  detail: (studentId: string, id: string) =>
    queryOptions({
      queryKey: ["teacher-submissions", "detail", studentId, id],
      queryFn: () => getTeacherSubmission(studentId, id),
    }),
  awaiting: (studentId: string, page: number) =>
    queryOptions({
      queryKey: ["teacher-submissions", "list", studentId, "awaiting", page],
      queryFn: () => getTeacherStudentSubmissions(studentId, page, "NEEDS_REVIEW"),
    }),
  all: () => ["teacher-submissions"] as const,

  lists: () => [...teacherSubmissionQueries.all(), "list"] as const,

  studentLists: (studentId: string) => [...teacherSubmissionQueries.lists(), studentId] as const,

  list: (studentId: string) =>
    queryOptions({
      queryKey: teacherSubmissionQueries.studentLists(studentId),
      queryFn: () => getTeacherStudentSubmissions(studentId),
    }),
};
