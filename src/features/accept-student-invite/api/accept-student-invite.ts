import { useMutation, useQueryClient } from "@tanstack/react-query";

import { currentUserQueryKey, type CurrentUser } from "@/entities/user";
import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type AcceptStudentInviteRequest = components["schemas"]["AcceptStudentInviteRequest"];

async function acceptStudentInvite(
  token: string,
  body: AcceptStudentInviteRequest,
): Promise<CurrentUser> {
  const { data, error, response } = await apiClient.POST(
    "/api/v1/public/student-invitations/{token}/accept",
    { params: { path: { token } }, body },
  );

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useAcceptStudentInviteMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AcceptStudentInviteRequest) => acceptStudentInvite(token, body),
    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}
