import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  type CreateLessonSessionRequest,
  type LessonSessionDetails,
  sessionQueries,
  type UpdateLessonSessionRequest,
} from "@/entities/session";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function createSession(studentId: string, body: CreateLessonSessionRequest): Promise<LessonSessionDetails> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/students/{studentId}/sessions", {
    params: { path: { studentId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

async function updateSession(
  studentId: string,
  sessionId: string,
  body: UpdateLessonSessionRequest,
): Promise<LessonSessionDetails> {
  const { data, error, response } = await apiClient.PATCH("/api/v1/teacher/students/{studentId}/sessions/{sessionId}", {
    params: { path: { studentId, sessionId } },
    body,
  });
  if (error) throw new ApiClientError(response.status, error);
  return data;
}

export function useCreateSessionMutation(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLessonSessionRequest) => createSession(studentId, body),
    onSuccess: async (created) => {
      queryClient.setQueryData(sessionQueries.detail(studentId, created.id).queryKey, created);
      await queryClient.invalidateQueries({ queryKey: sessionQueries.studentLists(studentId) });
    },
  });
}

export function useUpdateSessionMutation(studentId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateLessonSessionRequest) => updateSession(studentId, sessionId, body),
    onSuccess: async (updated) => {
      queryClient.setQueryData(sessionQueries.detail(studentId, sessionId).queryKey, updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionQueries.studentLists(studentId) }),
        queryClient.invalidateQueries({ queryKey: sessionQueries.detail(studentId, sessionId).queryKey }),
      ]);
    },
  });
}
