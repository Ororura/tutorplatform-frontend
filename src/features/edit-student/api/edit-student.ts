import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentQueries } from "@/entities/student";
import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type UpdateStudentRequest = components["schemas"]["UpdateStudentRequest"];
type UpdateStudentResponse = components["schemas"]["UpdateStudentResponse"];

type Variables = { studentId: string; body: UpdateStudentRequest };

async function updateStudent({ studentId, body }: Variables): Promise<UpdateStudentResponse> {
  const { data, error, response } = await apiClient.PATCH(
    "/api/v1/teacher/students/{studentId}",
    { params: { path: { studentId } }, body },
  );

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useEditStudentMutation(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStudentRequest) => updateStudent({ studentId, body }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentQueries.detail(studentId).queryKey }),
        queryClient.invalidateQueries({ queryKey: studentQueries.lists() }),
      ]);
    },
  });
}
