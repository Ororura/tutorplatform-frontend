import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/generated/schema";

export type StudentSummary = components["schemas"]["StudentSummaryResponse"];
export type StudentDetails = components["schemas"]["StudentDetailsResponse"];
export type StudentPage = components["schemas"]["StudentPageResponse"];
export type StudentListParams = NonNullable<
  operations["listTeacherStudents"]["parameters"]["query"]
>;
export type StudentAccountStatus = StudentSummary["accountStatus"];

async function getStudentList(params: StudentListParams): Promise<StudentPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students", {
    params: { query: params },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

async function getStudent(studentId: string): Promise<StudentDetails> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/teacher/students/{studentId}",
    { params: { path: { studentId } } },
  );

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const studentQueries = {
  all: () => ["students"] as const,
  lists: () => [...studentQueries.all(), "list"] as const,
  list: (params: StudentListParams) =>
    queryOptions({
      queryKey: [...studentQueries.lists(), params] as const,
      queryFn: () => getStudentList(params),
      placeholderData: keepPreviousData,
    }),
  details: () => [...studentQueries.all(), "detail"] as const,
  detail: (studentId: string) =>
    queryOptions({
      queryKey: [...studentQueries.details(), studentId] as const,
      queryFn: () => getStudent(studentId),
    }),
};
