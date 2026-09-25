import type { components } from "@/shared/api/generated/schema";

export type ContentPackagePreviewResponse = components["schemas"]["ContentPackagePreviewResponse"];
export type ContentPackageImportResponse = components["schemas"]["ContentPackageImportResponse"];
export type ContentPackagePreviewError = components["schemas"]["ContentPackagePreviewError"];

export type ImportContentPackageRequest = {
  file: File;
  confirmationId: string;
  digest: string;
};

export class ContentPackagePreviewValidationError extends Error {
  readonly name = "ContentPackagePreviewValidationError";

  constructor(
    public readonly status: number,
    public readonly errors: ContentPackagePreviewError[],
  ) {
    super(errors[0]?.message ?? "Content package validation failed");
  }
}
