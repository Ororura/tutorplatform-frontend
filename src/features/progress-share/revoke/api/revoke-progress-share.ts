import { useMutation, useQueryClient } from "@tanstack/react-query";

import { progressShareQueries } from "@/entities/progress-share";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function revokeProgressShare(studentId: string, shareId: string): Promise<void> {
  const { error, response } = await apiClient.DELETE("/api/v1/teacher/students/{studentId}/progress/shares/{shareId}", {
    params: { path: { studentId, shareId } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }
}

export function useRevokeProgressShareMutation(studentId: string, studentProgramId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => revokeProgressShare(studentId, shareId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: progressShareQueries.list(studentId, studentProgramId).queryKey,
      });
    },
  });
}
