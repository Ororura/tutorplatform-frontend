import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentHomeworkQueries } from "@/entities/homework";
import { studentSubmissionQueries, type StudentSubmission } from "@/entities/submission";
import { apiClient, ApiClientError } from "@/shared/api/client";

type SubmitCodeAnswerBaseInput = {
  taskId: string;
  sourceCode: string;
};

export type SubmitCodeAnswerInput = SubmitCodeAnswerBaseInput &
  (
    | { homeworkItemId: string; studentProgramId?: never; topicId?: never }
    | { homeworkItemId?: never; studentProgramId: string; topicId: string }
  );

export async function submitCodeAnswer({
  taskId,
  homeworkItemId,
  studentProgramId,
  topicId,
  sourceCode,
}: SubmitCodeAnswerInput): Promise<StudentSubmission> {
  const { data, error, response } = await apiClient.POST("/api/v1/student/tasks/{taskId}/code-submissions", {
    params: { path: { taskId } },
    body: homeworkItemId
      ? { homeworkItemId, sourceCode }
      : { studentProgramId: studentProgramId!, topicId: topicId!, sourceCode },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useSubmitCodeAnswerMutation(homeworkId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitCodeAnswer,
    onSuccess: async (_submission, input) => {
      const homeworkInvalidations = homeworkId
        ? [
            queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.lists() }),
            queryClient.invalidateQueries({ queryKey: studentHomeworkQueries.detail(homeworkId).queryKey }),
          ]
        : [];

      await Promise.all([
        ...homeworkInvalidations,
        queryClient.invalidateQueries({
          queryKey: studentSubmissionQueries.list(input.taskId, input.homeworkItemId).queryKey,
        }),
      ]);
    },
  });
}
