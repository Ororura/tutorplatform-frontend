import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type CreateLearningProgramRequest,
  type LearningProgram,
  learningProgramQueries,
} from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function createLearningProgram(body: CreateLearningProgramRequest): Promise<LearningProgram> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/programs", {
    body,
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useCreateLearningProgramMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLearningProgram,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: learningProgramQueries.lists(),
      });
    },
  });
}
