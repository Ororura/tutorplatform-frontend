import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentHomeworkQueries } from "@/entities/homework";
import { studentSubmissionQueries, type StudentSubmission } from "@/entities/submission";
import { apiClient, ApiClientError } from "@/shared/api/client";

export type SubmitTextAnswerInput = {
  taskId: string;
  homeworkItemId: string;
  textAnswer: string;
};

export async function submitTextAnswer({ taskId, homeworkItemId, textAnswer }: SubmitTextAnswerInput): Promise<StudentSubmission> {
  const { data, error, response } = await apiClient.POST("/api/v1/student/tasks/{taskId}/submissions", {
    params: { path: { taskId } },
    body: { homeworkItemId, textAnswer },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useSubmitTextAnswerMutation(homeworkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitTextAnswer,
    onSuccess: async (_submission, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.lists() }),
        queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.detail(homeworkId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentSubmissionQueries.list(input.taskId, input.homeworkItemId).queryKey }),
      ]);
    },
  });
}
