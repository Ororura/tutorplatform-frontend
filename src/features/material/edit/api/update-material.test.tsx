import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { topicMaterialQueries } from "@/entities/material";
import { apiClient } from "@/shared/api/client";

import { useUpdateMaterialMutation } from "./update-material";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { PATCH: vi.fn() },
}));

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useUpdateMaterialMutation", () => {
  beforeEach(() => {
    vi.mocked(apiClient.PATCH)
      .mockReset()
      .mockResolvedValue({
        data: { id: "material-1" },
        error: undefined,
        response: new Response(null, { status: 200 }),
      } as never);
  });

  it("updates through PATCH and invalidates the topic material list", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateMaterialMutation("topic-1", "material-1"), {
      wrapper: createWrapper(client),
    });
    const body = {
      materialType: "TEXT" as const,
      title: "Название",
      content: "Содержимое",
      externalUrl: null,
      position: 4,
      version: 9,
    };

    await act(() => result.current.mutateAsync(body));

    expect(apiClient.PATCH).toHaveBeenCalledWith("/api/v1/teacher/topics/{topicId}/materials/{materialId}", {
      params: { path: { topicId: "topic-1", materialId: "material-1" } },
      body,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: topicMaterialQueries.list("topic-1").queryKey });
  });
});
