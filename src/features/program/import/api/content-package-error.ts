import { ApiClientError, type ApiErrorBody } from "@/shared/api/client";

import { ContentPackagePreviewValidationError, type ContentPackagePreviewError } from "../model/content-package";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeMessage(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim() || value.length > 500) return null;
  if (/<[^>]*>|\n|\r|\bat\s+\S+\(/i.test(value)) return null;
  return value;
}

function fallbackError(response: Response): ApiClientError {
  return new ApiClientError(response.status, {
    code: "HTTP_ERROR",
    message: `Request failed with status ${response.status}`,
    timestamp: new Date().toISOString(),
    traceId: response.headers.get("X-Trace-Id") ?? "",
    details: [],
  });
}

export async function readContentPackageError(response: Response, preview = false): Promise<Error> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return fallbackError(response);
  }

  if (preview && isRecord(payload) && Array.isArray(payload.errors) && payload.errors.length > 0) {
    const errors: ContentPackagePreviewError[] = [];
    for (const item of payload.errors) {
      if (!isRecord(item) || typeof item.code !== "string" || typeof item.path !== "string") {
        return fallbackError(response);
      }
      const message = safeMessage(item.message);
      if (!message) return fallbackError(response);
      errors.push({ code: item.code, path: item.path, message });
    }
    return new ContentPackagePreviewValidationError(response.status, errors);
  }

  if (!isRecord(payload) || typeof payload.code !== "string") return fallbackError(response);
  const message = safeMessage(payload.message);
  if (!message) return fallbackError(response);

  const body: ApiErrorBody = {
    code: payload.code,
    message,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : new Date().toISOString(),
    traceId: typeof payload.traceId === "string" ? payload.traceId : (response.headers.get("X-Trace-Id") ?? ""),
    details: Array.isArray(payload.details)
      ? payload.details.filter(
          (detail): detail is ApiErrorBody["details"][number] =>
            isRecord(detail) && typeof detail.field === "string" && typeof detail.message === "string",
        )
      : [],
  };
  return new ApiClientError(response.status, body);
}
