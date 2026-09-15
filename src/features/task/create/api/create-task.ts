import { useMutation, useQueryClient } from "@tanstack/react-query";

import { taskQueries, type CreateTaskRequest, type Task } from "@/entities/task";
import { ApiClientError, apiClient } from "@/shared/api/client";

async function createTask(body: CreateTaskRequest): Promise<Task> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/tasks", { body });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: async (task) => {
      queryClient.setQueryData(taskQueries.detail(task.id).queryKey, task);
      await queryClient.invalidateQueries({ queryKey: taskQueries.lists() });
    },
  });
}
