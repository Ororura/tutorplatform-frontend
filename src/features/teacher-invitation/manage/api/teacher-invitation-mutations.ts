import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  requireCreatedTeacherInvitation,
  teacherInvitationQueries,
  type CreatedTeacherInvitation,
} from "@/entities/teacher-invitation";

import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

async function createInvitation(email: string): Promise<CreatedTeacherInvitation> {
  const { data, error, response } = await apiClient.POST("/api/v1/admin/teacher-invitations", {
    body: { email },
  });

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось создать приглашение",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  return requireCreatedTeacherInvitation(data);
}

async function revokeInvitation(invitationId: string): Promise<void> {
  const { error, response } = await apiClient.DELETE("/api/v1/admin/teacher-invitations/{invitationId}", {
    params: {
      path: { invitationId },
    },
  });

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось отозвать приглашение",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }
}

export function useCreateTeacherInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvitation,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: teacherInvitationQueries.all(),
      });
    },
  });
}

export function useRevokeTeacherInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitation,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: teacherInvitationQueries.all(),
      });
    },
  });
}
