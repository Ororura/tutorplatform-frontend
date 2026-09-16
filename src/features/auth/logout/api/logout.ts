import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";

async function logout(): Promise<void> {
  const { error, response } = await apiClient.POST("/api/v1/auth/logout");

  if (error) {
    throw new ApiClientError(response.status, error);
  }
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.clear(),
  });
}
