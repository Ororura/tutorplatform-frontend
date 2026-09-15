import { queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components, operations } from "@/shared/api/generated/schema";

export type Task = components["schemas"]["TaskResponse"];
export type TaskPage = components["schemas"]["TaskPageResponse"];
export type TaskType = Task["taskType"];
export type TaskDifficulty = Task["difficulty"];
export type TaskStatus = Task["status"];
export type TaskTestCase = components["schemas"]["TaskTestCaseResponse"];
export type CreateTaskRequest = components["schemas"]["CreateTaskRequest"];
export type UpdateTaskRequest = components["schemas"]["UpdateTaskRequest"];
export type Subject = components["schemas"]["SubjectSummaryResponse"];
export type TaskListParams = NonNullable<operations["listTasks"]["parameters"]["query"]>;

export async function getTeacherTasks(params: TaskListParams): Promise<TaskPage> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/tasks", { params: { query: params } });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export async function getTeacherTask(taskId: string): Promise<Task> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/tasks/{taskId}", {
    params: { path: { taskId } },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export async function getTeacherSubjects(): Promise<Subject[]> {
  const { data, error, response } = await apiClient.GET("/api/v1/teacher/subjects", {
    params: { query: {} },
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export const taskQueries = {
  all: () => ["teacher-tasks"] as const,
  lists: () => [...taskQueries.all(), "list"] as const,
  list: (params: TaskListParams) => queryOptions({
    queryKey: [...taskQueries.lists(), params] as const,
    queryFn: () => getTeacherTasks(params),
  }),
  details: () => [...taskQueries.all(), "detail"] as const,
  detail: (taskId: string) => queryOptions({
    queryKey: [...taskQueries.details(), taskId] as const,
    queryFn: () => getTeacherTask(taskId),
  }),
  subjects: () => queryOptions({
    queryKey: [...taskQueries.all(), "subjects"] as const,
    queryFn: getTeacherSubjects,
  }),
};
