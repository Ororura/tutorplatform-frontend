import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateLearningProgramTopicMutation,
  useUpdateLearningProgramTopicMutation,
} from "./manage-learning-program-topic";

const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post, PATCH: mocks.patch },
}));

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("learning program topic mutations", () => {
  beforeEach(() => {
    mocks.post.mockReset().mockResolvedValue({ data: { id: "topic-1" }, response: { status: 201 } });
    mocks.patch.mockReset().mockResolvedValue({ data: { id: "topic-1" }, response: { status: 200 } });
  });

  it("creates a topic and invalidates program detail", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateLearningProgramTopicMutation("program-1", "module-1"), {
      wrapper: createWrapper(client),
    });
    act(() => result.current.mutate({ title: "Тема", description: null }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.post).toHaveBeenCalledWith("/api/v1/teacher/programs/{programId}/modules/{moduleId}/topics", {
      params: { path: { programId: "program-1", moduleId: "module-1" } },
      body: { title: "Тема", description: null },
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["learning-programs", "detail", "program-1"] });
  });

  it("updates a topic with its version", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const { result } = renderHook(() => useUpdateLearningProgramTopicMutation("program-1", "module-1", "topic-1"), {
      wrapper: createWrapper(client),
    });
    act(() => result.current.mutate({ title: "Тема", description: "Описание", status: "ACTIVE", version: 2 }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.patch).toHaveBeenCalledWith(
      "/api/v1/teacher/programs/{programId}/modules/{moduleId}/topics/{topicId}",
      {
        params: { path: { programId: "program-1", moduleId: "module-1", topicId: "topic-1" } },
        body: { title: "Тема", description: "Описание", status: "ACTIVE", version: 2 },
      },
    );
  });
});
