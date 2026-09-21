import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";
import type { LearningProgramDetails } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type CreateLearningProgramModuleRequest = components["schemas"]["CreateLearningProgramModuleRequest"];
type UpdateLearningProgramModuleRequest = components["schemas"]["UpdateLearningProgramModuleRequest"];
type ReorderLearningProgramModulesRequest = components["schemas"]["ReorderLearningProgramModulesRequest"];
export type LearningProgramModule = components["schemas"]["LearningProgramModuleDetailsResponse"];

async function createLearningProgramModule(programId: string, body: CreateLearningProgramModuleRequest) {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/programs/{programId}/modules", {
    params: { path: { programId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function updateLearningProgramModule(
  programId: string,
  moduleId: string,
  body: UpdateLearningProgramModuleRequest,
) {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/programs/{programId}/modules/{moduleId}", {
    params: { path: { programId, moduleId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function deleteLearningProgramModule(programId: string, moduleId: string) {
  const { error, response } = await apiClient.DELETE("/api/v1/teacher/programs/{programId}/modules/{moduleId}", {
    params: { path: { programId, moduleId } },
  });
  if (error) throw new ApiClientError(response.status, error);
}

async function reorderLearningProgramModules(programId: string, body: ReorderLearningProgramModulesRequest) {
  const { error, response } = await apiClient.PUT("/api/v1/teacher/programs/{programId}/modules/order", {
    params: { path: { programId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
}

function useInvalidateProgramDetail() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: learningProgramQueries.all(),
    });
}

export function useCreateLearningProgramModuleMutation(programId: string) {
  const invalidate = useInvalidateProgramDetail();
  return useMutation({
    mutationFn: (body: CreateLearningProgramModuleRequest) => createLearningProgramModule(programId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateLearningProgramModuleMutation(programId: string, moduleId: string) {
  const invalidate = useInvalidateProgramDetail();
  return useMutation({
    mutationFn: (body: UpdateLearningProgramModuleRequest) => updateLearningProgramModule(programId, moduleId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteLearningProgramModuleMutation(programId: string, moduleId: string) {
  const invalidate = useInvalidateProgramDetail();
  return useMutation({ mutationFn: () => deleteLearningProgramModule(programId, moduleId), onSuccess: invalidate });
}

export function useReorderLearningProgramModulesMutation(programId: string) {
  const queryClient = useQueryClient();
  const queryKey = learningProgramQueries.detail(programId).queryKey;

  return useMutation({
    mutationFn: (body: ReorderLearningProgramModulesRequest) => reorderLearningProgramModules(programId, body),
    onMutate: async ({ orderedIds }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousProgram = queryClient.getQueryData<LearningProgramDetails>(queryKey);
      queryClient.setQueryData<LearningProgramDetails>(queryKey, (current) =>
        current
          ? {
              ...current,
              modules: orderedIds
                .map((id, position) => {
                  const learningModule = current.modules.find((item) => item.id === id);
                  return learningModule ? { ...learningModule, position } : learningModule;
                })
                .filter((learningModule): learningModule is NonNullable<typeof learningModule> =>
                  Boolean(learningModule),
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
