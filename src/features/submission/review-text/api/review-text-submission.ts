import { useMutation, useQueryClient } from "@tanstack/react-query";

import { homeworkQueries } from "@/entities/homework";
import { teacherSubmissionQueries, type TeacherSubmission } from "@/entities/submission";
import { apiClient, ApiClientError } from "@/shared/api/client";

export type ReviewTextSubmissionInput = {
  studentId: string;
  submissionId: string;
  status: "PASSED" | "FAILED";
};

export async function reviewTextSubmission({
  studentId,
  submissionId,
  status,
}: ReviewTextSubmissionInput): Promise<TeacherSubmission> {
  const { data, error, response } = await apiClient.PATCH(
    "/api/v1/teacher/students/{studentId}/submissions/{submissionId}/review",
    {
      params: {
        path: {
          studentId,
          submissionId,
        },
      },
      body: {
        status,
      },
    },
  );

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useReviewTextSubmissionMutation(studentId: string, homeworkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewTextSubmission,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: teacherSubmissionQueries.studentLists(studentId),
        }),

        queryClient.invalidateQueries({
          queryKey: homeworkQueries.detail(studentId, homeworkId).queryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: homeworkQueries.studentLists(studentId),
        }),
      ]);
    },
  });
}
