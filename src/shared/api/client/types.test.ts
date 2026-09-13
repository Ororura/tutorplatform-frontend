import { describe, expect, it } from "vitest";

import { ApiClientError, shouldRetryApiError } from "./types";

function apiError(status: number) {
  return new ApiClientError(status, {
    code: "TEST_ERROR",
    message: "Test error",
    timestamp: new Date().toISOString(),
    traceId: "trace-id",
    details: [{ field: "email", message: "Invalid" }],
  });
}

describe("API error retry policy", () => {
  it.each([400, 401, 403, 404, 409, 410])("does not retry HTTP %s", (status) => {
    expect(shouldRetryApiError(0, apiError(status))).toBe(false);
  });

  it("preserves the generated ApiError fields for features", () => {
    const error = apiError(409);

    expect(error).toMatchObject({
      status: 409,
      body: {
        code: "TEST_ERROR",
        message: "Test error",
        traceId: "trace-id",
        details: [{ field: "email", message: "Invalid" }],
      },
    });
  });

  it("retries a transient server or network failure at most once", () => {
    expect(shouldRetryApiError(0, apiError(500))).toBe(true);
    expect(shouldRetryApiError(1, apiError(500))).toBe(false);
    expect(shouldRetryApiError(0, new TypeError("Network error"))).toBe(true);
  });
});
