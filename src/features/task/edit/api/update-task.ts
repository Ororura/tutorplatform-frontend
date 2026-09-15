import { useMutation, useQueryClient } from "@tanstack/react-query";

import { taskQueries, type Task, type UpdateTaskRequest } from "@/entities/task";
import { ApiClientError, apiClient } from "@/shared/api/client";

async function updateTask(taskId: string, body: UpdateTaskRequest): Promise<Task> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/tasks/{taskId}", { params: { path: { taskId } }, body });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useUpdateTaskMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (body: UpdateTaskRequest) => updateTask(taskId, body), onSuccess: async (updated) => { queryClient.setQueryData(taskQueries.detail(taskId).queryKey, updated); await queryClient.invalidateQueries({ queryKey: taskQueries.lists() }); } });
}
