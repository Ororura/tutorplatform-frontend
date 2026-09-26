import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type BulkTopicStatusRequest = components["schemas"]["BulkUpdateLearningProgramTopicStatusRequest"];

export function useBulkTopicStatusMutation(programId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: learningProgramQueries.all() });

  return useMutation({
    mutationFn: async (body: BulkTopicStatusRequest) => {
      const { error, response } = await apiClient.PATCH("/api/v1/teacher/programs/{programId}/topics/status", {
        params: { path: { programId } },
        body,
      });
      if (error) throw new ApiClientError(response.status, error);
    },
    onSuccess: invalidate,
    onError: (error) => {
      if (error instanceof ApiClientError && error.status === 409) return invalidate();
    },
  });
}
