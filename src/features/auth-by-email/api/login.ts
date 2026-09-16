import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type CurrentUser, currentUserQueryKey } from "@/entities/user";
import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type LoginRequest = components["schemas"]["LoginRequest"];

async function login(body: LoginRequest): Promise<CurrentUser> {
  const { data, error, response } = await apiClient.POST("/api/v1/auth/login", { body });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}
