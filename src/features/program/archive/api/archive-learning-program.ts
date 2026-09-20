import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type LearningProgram, learningProgramQueries } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function archiveLearningProgram(programId: string): Promise<LearningProgram> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/programs/{programId}/archive", {
    params: { path: { programId } },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useArchiveLearningProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveLearningProgram,
    onSuccess: async (_updated, programId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: learningProgramQueries.detail(programId).queryKey }),
        queryClient.invalidateQueries({ queryKey: learningProgramQueries.lists() }),
      ]);
    },
  });
}
