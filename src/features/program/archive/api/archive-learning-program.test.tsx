import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useArchiveLearningProgramMutation } from "./archive-learning-program";

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post },
}));

describe("useArchiveLearningProgramMutation", () => {
  beforeEach(() => mocks.post.mockReset());

  it("archives the program and invalidates its detail and lists", async () => {
    mocks.post.mockResolvedValue({ data: { id: "program-1", status: "ARCHIVED" }, response: { status: 200 } });
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useArchiveLearningProgramMutation(), { wrapper });

    act(() => result.current.mutate("program-1"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.post).toHaveBeenCalledWith("/api/v1/teacher/programs/{programId}/archive", {
      params: { path: { programId: "program-1" } },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["learning-programs"] });
  });
});
