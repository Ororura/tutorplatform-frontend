import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CurrentProgress = components["schemas"]["CurrentProgressResponse"];
export type ProgressTopics = components["schemas"]["TopicsResponse"];
export type ProgressTopic = components["schemas"]["TopicResponse"];
export type ProgressHomework = components["schemas"]["HomeworkResponse"];
export type ProgressPractice = components["schemas"]["PracticeResponse"];
export type ProgressAssessment = components["schemas"]["AssessmentResponse"];

export async function getTeacherStudentProgress(studentId: string, studentProgramId: string): Promise<CurrentProgress> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/students/{studentId}/progress", {
    params: {
      path: { studentId },
      query: { studentProgramId },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const progressQueries = {
  all: () => ["progress"] as const,
  student: (studentId: string) => [...progressQueries.all(), "student", studentId] as const,
  detail: (studentId: string, studentProgramId: string) =>
    queryOptions({
      queryKey: [...progressQueries.student(studentId), "program", studentProgramId] as const,
      queryFn: () => getTeacherStudentProgress(studentId, studentProgramId),
    }),
};
