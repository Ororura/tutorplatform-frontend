import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReorderLessonMaterialsMutation } from "./reorder-materials";

const mocks = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { PUT: mocks.put },
}));

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("reorder lesson materials mutation", () => {
  beforeEach(() => {
    mocks.put.mockReset().mockResolvedValue({ response: { status: 204 } });
  });

  it("sends all ordered IDs and refreshes the materials after a successful reorder", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useReorderLessonMaterialsMutation("topic-1"), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.mutate({ orderedIds: ["material-2", "material-1"] }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.put).toHaveBeenCalledWith("/api/v1/teacher/topics/{topicId}/materials/order", {
      params: { path: { topicId: "topic-1" } },
      body: { orderedIds: ["material-2", "material-1"] },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["topic-materials", "topic-1"] });
  });

  it("restores the server order after a failed reorder", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const queryKey = ["topic-materials", "topic-1"];
    const initialMaterials = [
      { id: "material-1", title: "Первый", position: 0 },
      { id: "material-2", title: "Второй", position: 1 },
    ];
    client.setQueryData(queryKey, initialMaterials);
    mocks.put.mockResolvedValueOnce({ error: { code: "INVALID_ORDER" }, response: { status: 400 } });
    const { result } = renderHook(() => useReorderLessonMaterialsMutation("topic-1"), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.mutate({ orderedIds: ["material-2", "material-1"] }));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(client.getQueryData(queryKey)).toEqual(initialMaterials);
  });
});
