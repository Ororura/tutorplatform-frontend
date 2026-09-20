import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type LearningProgramDetails,
  learningProgramQueries,
  type UpdateLearningProgramRequest,
} from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function updateLearningProgram(
  programId: string,
  body: UpdateLearningProgramRequest,
): Promise<LearningProgramDetails> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/programs/{programId}", {
    params: { path: { programId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useUpdateLearningProgramMutation(programId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateLearningProgramRequest) => updateLearningProgram(programId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: learningProgramQueries.detail(programId).queryKey }),
        queryClient.invalidateQueries({ queryKey: learningProgramQueries.lists() }),
      ]);
    },
  });
}
