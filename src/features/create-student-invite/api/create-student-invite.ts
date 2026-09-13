import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentInviteQueries } from "@/entities/student-invite";
import { studentQueries } from "@/entities/student";
import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CreateStudentInviteRequest = components["schemas"]["CreateStudentInviteRequest"];
export type CreatedStudentInvite = components["schemas"]["StudentInviteCreatedResponse"];

async function createStudentInvite(
  studentId: string,
  body: CreateStudentInviteRequest,
): Promise<CreatedStudentInvite> {
  const { data, error, response } = await apiClient.POST(
    "/api/v1/teacher/students/{studentId}/invites",
    { params: { path: { studentId } }, body },
  );

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useCreateStudentInviteMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateStudentInviteRequest) => createStudentInvite(studentId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentInviteQueries.list(studentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentQueries.detail(studentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentQueries.lists() }),
      ]);
    },
  });
}
