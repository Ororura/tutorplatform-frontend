import { queryOptions } from "@tanstack/react-query";

import { apiClient, ApiClientError } from "@/shared/api/client";
import type { components } from "@/shared/api/generated/schema";

export type PublicCurrentProgress = components["schemas"]["PublicCurrentProgressResponse"];

export async function getPublicCurrentProgress(token: string): Promise<PublicCurrentProgress> {
  const { data, error, response } = await apiClient.GET("/api/v1/public/progress/{token}", {
    params: { path: { token } },
  });

  if (error) {
    throw new ApiClientError(response.status, error);
  }

  return data;
}

export const publicProgressQueries = {
  detail: (token: string) =>
    queryOptions({
      queryKey: ["public-progress", token] as const,
      queryFn: () => getPublicCurrentProgress(token),
      retry: false,
    }),
};
