import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { learningProgramQueries } from "@/entities/learning-program";

import { useReorderLearningProgramModulesMutation } from "./manage-learning-program-module";

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

describe("learning program module reorder mutation", () => {
  beforeEach(() => {
    mocks.put.mockReset().mockResolvedValue({ response: { status: 204 } });
  });

  it("sends all module IDs and invalidates program detail after success", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useReorderLearningProgramModulesMutation("program-1"), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.mutate({ orderedIds: ["module-2", "module-1"] }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.put).toHaveBeenCalledWith("/api/v1/teacher/programs/{programId}/modules/order", {
      params: { path: { programId: "program-1" } },
      body: { orderedIds: ["module-2", "module-1"] },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: learningProgramQueries.all() });
  });
});
