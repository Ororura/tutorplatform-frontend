import { useQuery } from "@tanstack/react-query";

import { ApiClientError, apiClient } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type CurrentUser = components["schemas"]["CurrentUserResponse"];

export const currentUserQueryKey = ["current-user"] as const;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { data, error, response } = await apiClient.GET("/api/v1/auth/me");

  if (error) {
    if (response.status === 401) {
      return null;
    }
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  });
}
