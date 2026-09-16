import { useMutation, useQueryClient } from "@tanstack/react-query";

import { studentQueries, type StudentSummary } from "@/entities/student";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CreateStudentRequest = components["schemas"]["CreateStudentRequest"];

async function createStudent(body: CreateStudentRequest): Promise<StudentSummary> {
  const { data, error, response } = await apiClient.POST("/api/v1/teacher/students", { body });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentQueries.lists() }),
  });
}
