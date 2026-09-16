import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type CurrentUser, currentUserQueryKey } from "@/entities/user";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type RegisterTeacherRequest = components["schemas"]["TeacherRegistrationRequest"];

async function registerTeacher(body: RegisterTeacherRequest): Promise<CurrentUser> {
  const { data, error, response } = await apiClient.POST("/api/v1/auth/register/teacher", { body });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useRegisterTeacherMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerTeacher,
    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}
