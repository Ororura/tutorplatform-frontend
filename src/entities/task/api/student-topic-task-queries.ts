import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type StudentTopicTask = components["schemas"]["StudentTopicTaskResponse"];

export async function getStudentTopicTasks(studentProgramId: string, topicId: string): Promise<StudentTopicTask[]> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/student/programs/{studentProgramId}/topics/{topicId}/tasks",
    { params: { path: { studentProgramId, topicId } } },
  );

  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const studentTopicTaskQueries = {
  all: () => ["student-topic-tasks"] as const,
  list: (studentProgramId: string, topicId: string) =>
    queryOptions({
      queryKey: [...studentTopicTaskQueries.all(), studentProgramId, topicId] as const,
      queryFn: () => getStudentTopicTasks(studentProgramId, topicId),
    }),
};
