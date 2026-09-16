import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentInviteQueries } from "@/entities/student-invite";
import { studentQueries } from "@/entities/student";
import { apiClient, ApiClientError } from "@/shared/api/client";

async function revokeStudentInvite(studentId: string, inviteId: string): Promise<void> {
  const { error, response } = await apiClient.DELETE("/api/v1/teacher/students/{studentId}/invites/{inviteId}", {
    params: { path: { studentId, inviteId } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }
}

export function useRevokeStudentInviteMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => revokeStudentInvite(studentId, inviteId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentInviteQueries.list(studentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentQueries.detail(studentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentQueries.lists() }),
      ]);
    },
  });
}
