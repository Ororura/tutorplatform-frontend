import { useMutation } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type RunStudentCodeInput = {
  taskId: string;
  homeworkItemId: string;
  sourceCode: string;
};

export type StudentRunResult = components["schemas"]["RunCodeResponse"];

export async function runStudentCode({
  taskId,
  homeworkItemId,
  sourceCode,
}: RunStudentCodeInput): Promise<StudentRunResult> {
  const { data, error, response } = await apiClient.POST("/api/v1/student/tasks/{taskId}/run", {
    params: { path: { taskId } },
    body: { homeworkItemId, sourceCode },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useRunStudentCodeMutation() {
  return useMutation({ mutationFn: runStudentCode });
}
