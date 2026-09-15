import { useMutation, useQueryClient } from "@tanstack/react-query";

import { homeworkQueries, type CreateHomeworkRequest, type HomeworkDetails, type UpdateHomeworkRequest } from "@/entities/homework";
import { ApiClientError, apiClient } from "@/shared/api/client";

async function createHomework(studentId: string, body: CreateHomeworkRequest): Promise<HomeworkDetails> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/students/{studentId}/homeworks", { params: { path: { studentId } }, body });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function updateHomework(studentId: string, homeworkId: string, body: UpdateHomeworkRequest): Promise<HomeworkDetails> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/students/{studentId}/homeworks/{homeworkId}", { params: { path: { studentId, homeworkId } }, body });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useCreateHomeworkMutation(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (body: CreateHomeworkRequest) => createHomework(studentId, body), onSuccess: async (created) => { queryClient.setQueryData(homeworkQueries.detail(studentId, created.id).queryKey, created); await queryClient.invalidateQueries({ queryKey: homeworkQueries.studentLists(studentId) }); } });
}

export function useUpdateHomeworkMutation(studentId: string, homeworkId: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (body: UpdateHomeworkRequest) => updateHomework(studentId, homeworkId, body), onSuccess: async (updated) => { queryClient.setQueryData(homeworkQueries.detail(studentId, homeworkId).queryKey, updated); await queryClient.invalidateQueries({ queryKey: homeworkQueries.studentLists(studentId) }); } });
}
