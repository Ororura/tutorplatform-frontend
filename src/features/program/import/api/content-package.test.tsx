import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { learningProgramQueries } from "@/entities/learning-program";
import { apiTransport } from "@/shared/api/client";

import { importContentPackage, useImportContentPackageMutation } from "./import-content-package";
import { previewContentPackage, usePreviewContentPackageMutation } from "./preview-content-package";

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiTransport: vi.fn(),
}));

const transportMock = vi.mocked(apiTransport);
const file = new File(["modules: []"], "package.yaml", { type: "application/yaml" });
const request = { file, confirmationId: "confirmation-1", digest: "a".repeat(64) };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function queryWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("content package API", () => {
  beforeEach(() => transportMock.mockReset());

  it("sends the preview file as multipart and returns the typed preview response", async () => {
    const preview = { valid: true, programId: "program-1", digest: request.digest, modules: [], errors: [] };
    transportMock.mockResolvedValue(jsonResponse(preview));

    await expect(previewContentPackage("program-1", file)).resolves.toEqual(preview);

    const [url, init] = transportMock.mock.calls[0];
    expect(url).toBe("/api/v1/teacher/programs/program-1/imports/preview");
    expect(init).toMatchObject({ method: "POST" });
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("file")).toBe(file);
  });

  it("sends file, confirmationId and digest as multipart and returns the import response", async () => {
    const imported = { programId: "program-1", confirmationId: request.confirmationId, digest: request.digest };
    transportMock.mockResolvedValue(jsonResponse(imported, 201));

    await expect(importContentPackage("program-1", request)).resolves.toEqual(imported);

    const [url, init] = transportMock.mock.calls[0];
    expect(url).toBe("/api/v1/teacher/programs/program-1/imports");
    expect(init).toMatchObject({ method: "POST" });
    expect(init?.headers).toBeUndefined();
    const body = init?.body as FormData;
    expect(body.get("file")).toBe(file);
    expect(body.get("confirmationId")).toBe(request.confirmationId);
    expect(body.get("digest")).toBe(request.digest);
  });

  it("preserves all preview validation errors with status, code, path and message", async () => {
    const errors = [
      { code: "REQUIRED_FIELD", path: "modules[0].title", message: "Title is required" },
      { code: "INVALID_TYPE", path: "modules[0].topics", message: "Topics must be a list" },
    ];
    transportMock.mockResolvedValue(jsonResponse({ valid: false, errors }, 400));

    await expect(previewContentPackage("program-1", file)).rejects.toMatchObject({
      name: "ContentPackagePreviewValidationError",
      status: 400,
      errors,
    });
  });

  it.each(["DIGEST_MISMATCH", "CONFIRMATION_CONFLICT"])("preserves %s as ApiError", async (code) => {
    transportMock.mockResolvedValue(jsonResponse({ code, message: "Import conflict", traceId: "trace-1" }, 409));

    await expect(importContentPackage("program-1", request)).rejects.toMatchObject({
      status: 409,
      body: { code, message: "Import conflict", traceId: "trace-1" },
    });
  });

  it("reports a safe HTTP error for HTML and stack-trace responses", async () => {
    transportMock.mockResolvedValueOnce(new Response("<html>proxy failure</html>", { status: 502 }));
    await expect(previewContentPackage("program-1", file)).rejects.toMatchObject({
      status: 502,
      body: { code: "HTTP_ERROR", message: "Request failed with status 502" },
    });

    transportMock.mockResolvedValueOnce(jsonResponse({ code: "FAILED", message: "Error\n at Server.run()" }, 500));
    await expect(importContentPackage("program-1", request)).rejects.toMatchObject({
      status: 500,
      body: { code: "HTTP_ERROR", message: "Request failed with status 500" },
    });
  });

  it("propagates network failures", async () => {
    transportMock.mockRejectedValue(new TypeError("Network error"));
    await expect(previewContentPackage("program-1", file)).rejects.toThrow("Network error");
    await expect(importContentPackage("program-1", request)).rejects.toThrow("Network error");
    // Vitest also inspects rejected results retained by this mocked fetch.
    transportMock.mockReset();
  });

  it("does not invalidate program queries after preview", async () => {
    transportMock.mockResolvedValue(jsonResponse({ valid: true, errors: [] }));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => usePreviewContentPackageMutation("program-1"), {
      wrapper: queryWrapper(client),
    });

    act(() => result.current.mutate(file));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("invalidates both UUID detail and bySlug queries after import", async () => {
    transportMock.mockResolvedValue(jsonResponse({ programId: "program-1" }, 201));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const detailKey = learningProgramQueries.detail("program-1").queryKey;
    const slugKey = learningProgramQueries.bySlug("example").queryKey;
    client.setQueryData<unknown>(detailKey, { id: "program-1" });
    client.setQueryData<unknown>(slugKey, { id: "program-1" });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useImportContentPackageMutation("program-1"), {
      wrapper: queryWrapper(client),
    });

    act(() => result.current.mutate(request));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: learningProgramQueries.all() });
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(slugKey)?.isInvalidated).toBe(true);
  });
});
