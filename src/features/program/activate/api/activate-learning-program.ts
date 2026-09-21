import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type LearningProgram, learningProgramQueries } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function activateLearningProgram(programId: string): Promise<LearningProgram> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/programs/{programId}/activate", {
    params: {
      path: {
        programId,
      },
    },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useActivateLearningProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateLearningProgram,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: learningProgramQueries.all(),
      });
    },
  });
}
