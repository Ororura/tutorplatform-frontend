import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentHomeworkQueries } from "@/entities/homework";
import { studentSubmissionQueries, type StudentSubmission } from "@/entities/submission";
import { apiClient, ApiClientError } from "@/shared/api/client";

export type SubmitTextAnswerInput = {
  taskId: string;
  textAnswer: string;
} & (
  | { homeworkItemId: string; studentProgramId?: never; topicId?: never }
  | { homeworkItemId?: never; studentProgramId: string; topicId: string }
);

export async function submitTextAnswer({
  taskId,
  homeworkItemId,
  studentProgramId,
  topicId,
  textAnswer,
}: SubmitTextAnswerInput): Promise<StudentSubmission> {
  const { data, error, response } = await apiClient.POST("/api/v1/student/tasks/{taskId}/submissions", {
    params: { path: { taskId } },
    body: homeworkItemId
      ? { homeworkItemId, textAnswer }
      : { studentProgramId: studentProgramId!, topicId: topicId!, textAnswer },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useSubmitTextAnswerMutation(homeworkId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitTextAnswer,
    onSuccess: async (_submission, input) => {
      await Promise.all([
        ...(homeworkId
          ? [
              queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.lists() }),
              queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.detail(homeworkId).queryKey }),
            ]
          : []),
        queryClient.invalidateQueries({
          queryKey: [...studentSubmissionQueries.lists(), input.taskId],
        }),
      ]);
    },
  });
}
