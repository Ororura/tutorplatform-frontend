import { useMutation } from "@tanstack/react-query";

import { apiTransport } from "@/shared/api/client";

import type { ContentPackagePreviewResponse } from "../model/content-package";
import { readContentPackageError } from "./content-package-error";

export async function previewContentPackage(programId: string, file: File): Promise<ContentPackagePreviewResponse> {
  const body = new FormData();
  body.append("file", file);

  const response = await apiTransport(`/api/v1/teacher/programs/${encodeURIComponent(programId)}/imports/preview`, {
    method: "POST",
    body,
  });
  if (!response.ok) throw await readContentPackageError(response, true);
  return (await response.json()) as ContentPackagePreviewResponse;
}

export function usePreviewContentPackageMutation(programId: string) {
  return useMutation({ mutationFn: (file: File) => previewContentPackage(programId, file) });
}
