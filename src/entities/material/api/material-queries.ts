import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type LessonMaterial = components["schemas"]["LessonMaterialResponse"];
export type MaterialType = LessonMaterial["materialType"];

export async function getTopicMaterials(topicId: string): Promise<LessonMaterial[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/topics/{topicId}/materials", {
    params: { path: { topicId } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const topicMaterialQueries = {
  all: () => ["topic-materials"] as const,
  list: (topicId: string) =>
    queryOptions({
      queryKey: [...topicMaterialQueries.all(), topicId] as const,
      queryFn: () => getTopicMaterials(topicId),
    }),
};
