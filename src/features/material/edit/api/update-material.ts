import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type LessonMaterial, topicMaterialQueries } from "@/entities/material";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type UpdateMaterialRequest = components["schemas"]["UpdateLessonMaterialRequest"];

async function updateMaterial(
  topicId: string,
  materialId: string,
  body: UpdateMaterialRequest,
): Promise<LessonMaterial> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/topics/{topicId}/materials/{materialId}", {
    params: { path: { topicId, materialId } },
    body,
  });

  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useUpdateMaterialMutation(topicId: string, materialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateMaterialRequest) => updateMaterial(topicId, materialId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicMaterialQueries.list(topicId).queryKey }),
  });
}
