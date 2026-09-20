import { useMutation, useQueryClient } from "@tanstack/react-query";

import { topicMaterialQueries, type LessonMaterial, type MaterialType } from "@/entities/material";
import { apiTransport, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

const UPLOAD_PATH = "/api/v1/teacher/topics";

export type UploadMaterialRequest = {
  materialType: Extract<MaterialType, "FILE" | "IMAGE">;
  title: string;
  position: number;
  file: File;
};

async function readError(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`,
      timestamp: new Date().toISOString(),
      traceId: response.headers.get("X-Trace-Id") ?? "",
      details: [],
    };
  }
}

/**
 * OpenAPI currently exposes upload metadata as query parameters, while the
 * controller reads all fields from multipart/form-data. Keep this wrapper
 * typed and use the established CSRF-aware transport.
 */
export async function uploadMaterial(topicId: string, request: UploadMaterialRequest): Promise<LessonMaterial> {
  const body = new FormData();
  body.append("materialType", request.materialType);
  body.append("title", request.title);
  body.append("position", String(request.position));
  body.append("file", request.file);

  const response = await apiTransport(`${UPLOAD_PATH}/${topicId}/materials/upload`, {
    method: "POST",
    body,
  });

  if (!response.ok) throw new ApiClientError(response.status, await readError(response));
  return (await response.json()) as LessonMaterial;
}

export function useUploadMaterialMutation(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UploadMaterialRequest) => uploadMaterial(topicId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicMaterialQueries.list(topicId).queryKey }),
  });
}
