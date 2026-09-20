import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type TopicTask = components["schemas"]["TopicTaskDetailsResponse"];
export type AttachTaskToTopicRequest = components["schemas"]["AttachTaskToTopicRequest"];

export async function getTopicTasks(topicId: string): Promise<TopicTask[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/topics/{topicId}/tasks", {
    params: { path: { topicId } },
  });

  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const topicTaskQueries = {
  all: () => ["topic-tasks"] as const,
  list: (topicId: string) =>
    queryOptions({
      queryKey: [...topicTaskQueries.all(), topicId] as const,
      queryFn: () => getTopicTasks(topicId),
    }),
};
