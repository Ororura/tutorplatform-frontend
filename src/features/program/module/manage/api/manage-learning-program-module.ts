import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type CreateLearningProgramModuleRequest = components["schemas"]["CreateLearningProgramModuleRequest"];
type UpdateLearningProgramModuleRequest = components["schemas"]["UpdateLearningProgramModuleRequest"];
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

function useInvalidateProgramDetail(programId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: learningProgramQueries.detail(programId).queryKey });
}

export function useCreateLearningProgramModuleMutation(programId: string) {
  const invalidate = useInvalidateProgramDetail(programId);
  return useMutation({
    mutationFn: (body: CreateLearningProgramModuleRequest) => createLearningProgramModule(programId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateLearningProgramModuleMutation(programId: string, moduleId: string) {
  const invalidate = useInvalidateProgramDetail(programId);
  return useMutation({
    mutationFn: (body: UpdateLearningProgramModuleRequest) => updateLearningProgramModule(programId, moduleId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteLearningProgramModuleMutation(programId: string, moduleId: string) {
  const invalidate = useInvalidateProgramDetail(programId);
  return useMutation({ mutationFn: () => deleteLearningProgramModule(programId, moduleId), onSuccess: invalidate });
}
