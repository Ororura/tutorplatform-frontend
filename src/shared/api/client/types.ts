import type { components } from "../generated/schema";

export type ApiErrorBody = components["schemas"]["ApiError"];

export const nonRetryableApiStatuses = new Set([400, 401, 403, 404, 409, 410]);

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiClientError";
  }
}

export function shouldRetryApiError(failureCount: number, error: Error): boolean {
  if (error instanceof ApiClientError && nonRetryableApiStatuses.has(error.status)) {
    return false;
  }

  return failureCount < 1;
}
