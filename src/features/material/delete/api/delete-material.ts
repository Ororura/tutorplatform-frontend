import { useMutation, useQueryClient } from "@tanstack/react-query";

import { topicMaterialQueries } from "@/entities/material";
import { apiTransport, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

/** Deliberately use the shared CSRF-aware transport until OpenAPI types are regenerated. */
export async function deleteMaterial(topicId: string, materialId: string): Promise<void> {
  const response = await apiTransport(
    `/api/v1/teacher/topics/${encodeURIComponent(topicId)}/materials/${encodeURIComponent(materialId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    let body: ApiErrorBody;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = {
        code: "HTTP_ERROR",
        message: `Request failed with status ${response.status}`,
        timestamp: new Date().toISOString(),
        traceId: response.headers.get("X-Trace-Id") ?? "",
        details: [],
      };
    }
    throw new ApiClientError(response.status, body);
  }
}

export function useDeleteMaterialMutation(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => deleteMaterial(topicId, materialId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicMaterialQueries.list(topicId).queryKey }),
  });
}
