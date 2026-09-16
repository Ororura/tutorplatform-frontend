import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type HomeworkDetails, homeworkQueries } from "@/entities/homework";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function cancelHomework(studentId: string, homeworkId: string): Promise<HomeworkDetails> {
  const { data, error, response } = await apiClient.POST(
    "/api/v1/teacher/students/{studentId}/homeworks/{homeworkId}/cancel",
    {
      params: {
        path: {
          studentId,
          homeworkId,
        },
      },
    },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useCancelHomeworkMutation(studentId: string, homeworkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelHomework(studentId, homeworkId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(homeworkQueries.detail(studentId, homeworkId).queryKey, updated);
      await queryClient.invalidateQueries({ queryKey: homeworkQueries.studentLists(studentId) });
    },
  });
}
