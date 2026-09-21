import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type StudentProgramSummary = components["schemas"]["StudentProgramSummaryResponse"];
export type StudentProgramDetails = components["schemas"]["StudentProgramDetailsResponse"];
export type ProgramModule = components["schemas"]["ProgramModuleResponse"];
export type ProgramTopic = components["schemas"]["ProgramTopicResponse"];
export type TopicProgressStatus = ProgramTopic["progressStatus"];

export async function getStudentPrograms(studentId: string): Promise<StudentProgramSummary[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/programs", {
    params: { path: { studentId } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export async function getCurrentStudentPrograms(): Promise<StudentProgramSummary[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/student/programs");

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export async function getCurrentStudentProgram(studentProgramId: string): Promise<StudentProgramDetails> {
  const { data, error, response } = await apiClient.GET("/api/v1/student/programs/{studentProgramId}", {
    params: { path: { studentProgramId } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export async function getStudentProgram(studentId: string, studentProgramId: string): Promise<StudentProgramDetails> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/teacher/students/{studentId}/programs/{studentProgramId}",
    { params: { path: { studentId, studentProgramId } } },
  );

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const studentProgramQueries = {
  all: () => ["student-programs"] as const,
  lists: () => [...studentProgramQueries.all(), "list"] as const,
  currentList: () =>
    queryOptions({
      queryKey: [...studentProgramQueries.lists(), "current-student"] as const,
      queryFn: getCurrentStudentPrograms,
    }),
  list: (studentId: string) =>
    queryOptions({
      queryKey: [...studentProgramQueries.lists(), studentId] as const,
      queryFn: () => getStudentPrograms(studentId),
    }),
  details: () => [...studentProgramQueries.all(), "detail"] as const,
  currentDetail: (studentProgramId: string) =>
    queryOptions({
      queryKey: [...studentProgramQueries.details(), "current-student", studentProgramId] as const,
      queryFn: () => getCurrentStudentProgram(studentProgramId),
    }),
  studentDetails: (studentId: string) => [...studentProgramQueries.details(), studentId] as const,
  detail: (studentId: string, studentProgramId: string) =>
    queryOptions({
      queryKey: [...studentProgramQueries.studentDetails(studentId), studentProgramId] as const,
      queryFn: () => getStudentProgram(studentId, studentProgramId),
    }),
};
