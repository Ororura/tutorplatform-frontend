import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";
import type { LearningProgramDetails } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type CreateLearningProgramTopicRequest = components["schemas"]["CreateLearningProgramTopicRequest"];
type UpdateLearningProgramTopicRequest = components["schemas"]["UpdateLearningProgramTopicRequest"];
type ReorderLearningProgramTopicsRequest = components["schemas"]["ReorderLearningProgramTopicsRequest"];
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

async function reorderLearningProgramTopics(
  programId: string,
  moduleId: string,
  body: ReorderLearningProgramTopicsRequest,
) {
  const { error, response } = await apiClient.PUT(
    "/api/v1/teacher/programs/{programId}/modules/{moduleId}/topics/order",
    { params: { path: { programId, moduleId } }, body },
  );
  if (error) throw new ApiClientError(response.status, error);
}

function useInvalidateProgramDetail() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: learningProgramQueries.all(),
    });
}

export function useCreateLearningProgramTopicMutation(programId: string, moduleId: string) {
  const invalidate = useInvalidateProgramDetail();
  return useMutation({
    mutationFn: (body: CreateLearningProgramTopicRequest) => createLearningProgramTopic(programId, moduleId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateLearningProgramTopicMutation(programId: string, moduleId: string, topicId: string) {
  const invalidate = useInvalidateProgramDetail();
  return useMutation({
    mutationFn: (body: UpdateLearningProgramTopicRequest) =>
      updateLearningProgramTopic(programId, moduleId, topicId, body),
    onSuccess: invalidate,
  });
}

export function useReorderLearningProgramTopicsMutation(programId: string, moduleId: string) {
  const queryClient = useQueryClient();
  const queryKey = learningProgramQueries.detail(programId).queryKey;

  return useMutation({
    mutationFn: (body: ReorderLearningProgramTopicsRequest) => reorderLearningProgramTopics(programId, moduleId, body),
    onMutate: async ({ orderedIds }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousProgram = queryClient.getQueryData<LearningProgramDetails>(queryKey);
      queryClient.setQueryData<LearningProgramDetails>(queryKey, (current) =>
        current
          ? {
              ...current,
              modules: current.modules.map((module) =>
                module.id === moduleId
                  ? {
                      ...module,
                      topics: orderedIds
                        .map((id, position) => {
                          const topic = module.topics.find((item) => item.id === id);
                          return topic ? { ...topic, position } : topic;
                        })
                        .filter((topic): topic is NonNullable<typeof topic> => Boolean(topic)),
                    }
                  : module,
              ),
            }
          : current,
      );
      return { previousProgram };
    },
    onError: (_error, _body, context) => {
      if (context?.previousProgram) queryClient.setQueryData(queryKey, context.previousProgram);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningProgramQueries.all() }),
  });
}
