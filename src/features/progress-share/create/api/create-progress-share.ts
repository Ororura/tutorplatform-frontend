import { useMutation, useQueryClient } from "@tanstack/react-query";

import { progressShareQueries } from "@/entities/progress-share";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CreateProgressShareRequest = components["schemas"]["CreateProgressShareRequest"];
export type CreatedProgressShare = components["schemas"]["ProgressShareCreatedResponse"];

async function createProgressShare(studentId: string, body: CreateProgressShareRequest): Promise<CreatedProgressShare> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/students/{studentId}/progress/shares", {
    params: { path: { studentId } },
    body,
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useCreateProgressShareMutation(studentId: string, studentProgramId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expiresAt?: string) =>
      createProgressShare(studentId, {
        studentProgramId,
        ...(expiresAt ? { expiresAt } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: progressShareQueries.list(studentId, studentProgramId).queryKey,
      });
    },
  });
}
