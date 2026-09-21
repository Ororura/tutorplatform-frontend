import { useMutation } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type RunStudentCodeBaseInput = {
  taskId: string;
  sourceCode: string;
};

export type RunStudentCodeInput = RunStudentCodeBaseInput &
  (
    | { homeworkItemId: string; studentProgramId?: never; topicId?: never }
    | { homeworkItemId?: never; studentProgramId: string; topicId: string }
  );

export type StudentRunResult = components["schemas"]["RunCodeResponse"];

export async function runStudentCode({
  taskId,
  homeworkItemId,
  studentProgramId,
  topicId,
  sourceCode,
}: RunStudentCodeInput): Promise<StudentRunResult> {
  const { data, error, response } = await apiClient.POST("/api/v1/student/tasks/{taskId}/run", {
    params: { path: { taskId } },
    body: homeworkItemId
      ? { homeworkItemId, sourceCode }
      : { studentProgramId: studentProgramId!, topicId: topicId!, sourceCode },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useRunStudentCodeMutation() {
  return useMutation({ mutationFn: runStudentCode });
}
