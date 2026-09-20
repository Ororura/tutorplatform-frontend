import { useMutation, useQueryClient } from "@tanstack/react-query";

import { topicMaterialQueries, type LessonMaterial } from "@/entities/material";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

type ReorderLessonMaterialsRequest = components["schemas"]["ReorderLessonMaterialsRequest"];

async function reorderLessonMaterials(topicId: string, body: ReorderLessonMaterialsRequest) {
  const { error, response } = await apiClient.PUT("/api/v1/teacher/topics/{topicId}/materials/order", {
    params: { path: { topicId } },
    body,
  });

  if (error) throw new ApiClientError(response.status, error);
}

export function useReorderLessonMaterialsMutation(topicId: string) {
  const queryClient = useQueryClient();
  const queryKey = topicMaterialQueries.list(topicId).queryKey;

  return useMutation({
    mutationFn: (body: ReorderLessonMaterialsRequest) => reorderLessonMaterials(topicId, body),
    onMutate: async ({ orderedIds }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousMaterials = queryClient.getQueryData<LessonMaterial[]>(queryKey);
      queryClient.setQueryData<LessonMaterial[]>(queryKey, (current) =>
        current
          ? orderedIds
              .map((id, position) => {
                const material = current.find((item) => item.id === id);
                return material ? { ...material, position } : undefined;
              })
              .filter((material): material is LessonMaterial => Boolean(material))
          : current,
      );
      return { previousMaterials };
    },
    onError: (_error, _body, context) => {
      if (context?.previousMaterials) queryClient.setQueryData(queryKey, context.previousMaterials);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
