import { useMutation, useQueryClient } from "@tanstack/react-query";

import { publicTeacherInvitationQueries } from "@/entities/teacher-invitation";

import { type CurrentUser, currentUserQueryKey } from "@/entities/user";

import { apiClient, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

import type { components } from "@/shared/api/generated/schema";

export type AcceptTeacherInvitationRequest = components["schemas"]["AcceptTeacherInvitationRequest"];

async function acceptTeacherInvitation(token: string, body: AcceptTeacherInvitationRequest): Promise<CurrentUser> {
  const { data, error, response } = await apiClient.POST("/api/v1/public/teacher-invitations/{token}/accept", {
    params: {
      path: { token },
    },
    body,
  });

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      (error ?? {
        code: "API_ERROR",
        message: "Не удалось зарегистрироваться",
        timestamp: new Date().toISOString(),
        traceId: "",
        details: [],
      }) as ApiErrorBody,
    );
  }

  if (!data?.id || !data.email || !data.roles) {
    throw new Error("Backend returned invalid authenticated user");
  }

  return data as CurrentUser;
}

export function useAcceptTeacherInvitationMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AcceptTeacherInvitationRequest) => acceptTeacherInvitation(token, body),

    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);

      queryClient.removeQueries({
        queryKey: publicTeacherInvitationQueries.all(),
      });

      await queryClient.invalidateQueries({
        queryKey: currentUserQueryKey,
      });
    },
  });
}
