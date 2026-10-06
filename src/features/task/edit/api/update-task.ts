import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type Task, taskQueries, type UpdateTaskRequest } from "@/entities/task";
import { apiClient, ApiClientError } from "@/shared/api/client";

import type { components } from "@/shared/api/generated/schema";

type EditTaskRequest = UpdateTaskRequest & {
  programmingConfig?: components["schemas"]["UpdateProgrammingTaskConfigRequest"];
};

async function updateTask(taskId: string, request: EditTaskRequest): Promise<Task> {
  const { programmingConfig, ...body } = request;
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/tasks/{taskId}", {
    params: { path: { taskId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  if (programmingConfig) {
    const config = await apiClient.PUT("/api/v1/teacher/tasks/{taskId}/programming-config", {
      params: { path: { taskId } },
      body: programmingConfig,
    });
    if (config.error) throw new ApiClientError(config.response.status, config.error);
    return { ...data, programmingConfig: config.data };
  }
  return data;
}

export function useUpdateTaskMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EditTaskRequest) => updateTask(taskId, body),
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: taskQueries.detail(taskId).queryKey });
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(taskQueries.detail(taskId).queryKey, updated);
      await queryClient.invalidateQueries({ queryKey: taskQueries.lists() });
    },
  });
}
