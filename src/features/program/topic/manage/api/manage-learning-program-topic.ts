import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type CreateLearningProgramTopicRequest = components["schemas"]["CreateLearningProgramTopicRequest"];
type UpdateLearningProgramTopicRequest = components["schemas"]["UpdateLearningProgramTopicRequest"];
export type LearningProgramTopic = components["schemas"]["LearningProgramTopicDetailsResponse"];

async function createLearningProgramTopic(
  programId: string,
  moduleId: string,
  body: CreateLearningProgramTopicRequest,
) {
  const { data, error, response } = await apiClient.POST(
    "/api/v1/teacher/programs/{programId}/modules/{moduleId}/topics",
    {
      params: { path: { programId, moduleId } },
      body,
    },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function updateLearningProgramTopic(
  programId: string,
  moduleId: string,
  topicId: string,
  body: UpdateLearningProgramTopicRequest,
) {
  const { data, error, response } = await apiClient.PATCH(
    "/api/v1/teacher/programs/{programId}/modules/{moduleId}/topics/{topicId}",
    { params: { path: { programId, moduleId, topicId } }, body },
  );
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

function useInvalidateProgramDetail(programId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: learningProgramQueries.detail(programId).queryKey });
}

export function useCreateLearningProgramTopicMutation(programId: string, moduleId: string) {
  const invalidate = useInvalidateProgramDetail(programId);
  return useMutation({
    mutationFn: (body: CreateLearningProgramTopicRequest) => createLearningProgramTopic(programId, moduleId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateLearningProgramTopicMutation(programId: string, moduleId: string, topicId: string) {
  const invalidate = useInvalidateProgramDetail(programId);
  return useMutation({
    mutationFn: (body: UpdateLearningProgramTopicRequest) =>
      updateLearningProgramTopic(programId, moduleId, topicId, body),
    onSuccess: invalidate,
  });
}
