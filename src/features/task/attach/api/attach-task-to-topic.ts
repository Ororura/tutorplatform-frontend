import { useMutation, useQueryClient } from "@tanstack/react-query";

import { topicTaskQueries, type AttachTaskToTopicRequest } from "@/entities/task";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function attachTaskToTopic(topicId: string, taskId: string, body: AttachTaskToTopicRequest) {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/topics/{topicId}/tasks/{taskId}", {
    params: { path: { topicId, taskId } },
    body,
  });

  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useAttachTaskToTopicMutation(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, ...body }: AttachTaskToTopicRequest & { taskId: string }) =>
      attachTaskToTopic(topicId, taskId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicTaskQueries.list(topicId).queryKey }),
  });
}
