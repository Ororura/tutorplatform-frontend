import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateLearningProgramMutation } from "./update-learning-program";

const mocks = vi.hoisted(() => ({ patch: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { PATCH: mocks.patch },
}));

describe("useUpdateLearningProgramMutation", () => {
  beforeEach(() => mocks.patch.mockReset());

  it("updates the program and invalidates its detail and lists", async () => {
    mocks.patch.mockResolvedValue({ data: { id: "program-1" }, response: { status: 200 } });
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateLearningProgramMutation("program-1"), { wrapper });

    act(() => result.current.mutate({ title: "Алгебра", description: null, version: 3 }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.patch).toHaveBeenCalledWith("/api/v1/teacher/programs/{programId}", {
      params: { path: { programId: "program-1" } },
      body: { title: "Алгебра", description: null, version: 3 },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["learning-programs"] });
  });
});
