import { useMutation, useQueryClient } from "@tanstack/react-query";

import { topicMaterialQueries } from "@/entities/material";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type CreateMaterialRequest = components["schemas"]["CreateLessonMaterialRequest"];

async function createMaterial(topicId: string, body: CreateMaterialRequest) {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/topics/{topicId}/materials", {
    params: { path: { topicId } },
    body,
  });

  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useCreateMaterialMutation(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMaterialRequest) => createMaterial(topicId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicMaterialQueries.list(topicId).queryKey }),
  });
}
