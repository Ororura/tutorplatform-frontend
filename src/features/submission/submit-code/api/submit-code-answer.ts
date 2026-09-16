import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentHomeworkQueries } from "@/entities/homework";
import { studentSubmissionQueries, type StudentSubmission } from "@/entities/submission";
import { apiClient, ApiClientError } from "@/shared/api/client";

export type SubmitCodeAnswerInput = {
  taskId: string;
  homeworkItemId: string;
  sourceCode: string;
};

export async function submitCodeAnswer({
  taskId,
  homeworkItemId,
  sourceCode,
}: SubmitCodeAnswerInput): Promise<StudentSubmission> {
  const { data, error, response } = await apiClient.POST("/api/v1/student/tasks/{taskId}/code-submissions", {
    params: { path: { taskId } },
    body: { homeworkItemId, sourceCode },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useSubmitCodeAnswerMutation(homeworkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitCodeAnswer,
    onSuccess: async (_submission, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.lists() }),
        queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.detail(homeworkId).queryKey }),
        queryClient.invalidateQueries({
          queryKey: studentSubmissionQueries.list(input.taskId, input.homeworkItemId).queryKey,
        }),
      ]);
    },
  });
}
