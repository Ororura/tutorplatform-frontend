import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type StudentSubmission = components["schemas"]["StudentSubmissionResponse"];
export type StudentSubmissionPage = components["schemas"]["StudentSubmissionPageResponse"];

export async function getStudentTaskSubmissions(
  taskId: string,
  homeworkItemId?: string,
): Promise<StudentSubmissionPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/student/tasks/{taskId}/submissions", {
    params: {
      path: { taskId },
      query: { ...(homeworkItemId ? { homeworkItemId } : {}), page: 0, size: 20 },
    },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const studentSubmissionQueries = {
  all: () => ["student-submissions"] as const,
  lists: () => [...studentSubmissionQueries.all(), "list"] as const,
  list: (taskId: string, homeworkItemId?: string) =>
    queryOptions({
      queryKey: [...studentSubmissionQueries.lists(), taskId, homeworkItemId ?? "standalone"] as const,
      queryFn: () => getStudentTaskSubmissions(taskId, homeworkItemId),
    }),
};
