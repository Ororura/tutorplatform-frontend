import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";
import { useBulkTopicStatusMutation } from "./bulk-topic-status";

const mocks = vi.hoisted(() => ({ patch: vi.fn() }));
vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { PATCH: mocks.patch },
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const hook = renderHook(() => useBulkTopicStatusMutation("program-1"), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, invalidate };
}

describe("bulk topic status mutation", () => {
  beforeEach(() => mocks.patch.mockReset());

  it.each(["ACTIVE", "DRAFT", "ARCHIVED"] as const)(
    "PATCHes %s and invalidates both ID and slug queries on 204",
    async (status) => {
      mocks.patch.mockResolvedValue({ response: { status: 204 } });
      const { result, invalidate } = setup();
      const body = {
        status,
        topics: [
          { id: "topic-1", version: 7 },
          { id: "topic-2", version: 4 },
        ],
      };
      act(() => result.current.mutate(body));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mocks.patch).toHaveBeenCalledWith("/api/v1/teacher/programs/{programId}/topics/status", {
        params: { path: { programId: "program-1" } },
        body,
      });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["learning-programs"] });
    },
  );

  it.each([409, 500])("presents %s errors and refreshes data only for conflicts", async (status) => {
    mocks.patch.mockResolvedValue({ response: { status }, error: { message: "Failed", code: "CONFLICT" } });
    const { result, invalidate } = setup();
    act(() => result.current.mutate({ status: "ACTIVE", topics: [{ id: "topic-1", version: 7 }] }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiClientError);
    expect(result.current.error).toHaveProperty("status", status);
    expect(invalidate).toHaveBeenCalledTimes(status === 409 ? 1 : 0);
  });
});
