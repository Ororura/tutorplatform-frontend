import { useMutation, useQueryClient } from "@tanstack/react-query";

import { learningProgramQueries } from "@/entities/learning-program";
import { apiTransport } from "@/shared/api/client";

import type { ContentPackageImportResponse, ImportContentPackageRequest } from "../model/content-package";
import { readContentPackageError } from "./content-package-error";

export async function importContentPackage(
  programId: string,
  request: ImportContentPackageRequest,
): Promise<ContentPackageImportResponse> {
  const body = new FormData();
  body.append("file", request.file);
  body.append("confirmationId", request.confirmationId);
  body.append("digest", request.digest);

  const response = await apiTransport(`/api/v1/teacher/programs/${encodeURIComponent(programId)}/imports`, {
    method: "POST",
    body,
  });
  if (!response.ok) throw await readContentPackageError(response);
  return (await response.json()) as ContentPackageImportResponse;
}

export function useImportContentPackageMutation(programId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ImportContentPackageRequest) => importContentPackage(programId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningProgramQueries.all() }),
  });
}
