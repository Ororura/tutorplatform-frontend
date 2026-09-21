import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateLearningProgramTopicMutation,
  useReorderLearningProgramTopicsMutation,
  useUpdateLearningProgramTopicMutation,
} from "./manage-learning-program-topic";

const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), put: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post, PATCH: mocks.patch, PUT: mocks.put },
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
    mocks.put.mockReset().mockResolvedValue({ response: { status: 204 } });
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
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["learning-programs"] });
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

  it("restores the server order after a failed topic reorder without changing another module", async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const queryKey = ["learning-programs", "detail", "program-1"];
    const initialProgram = {
      id: "program-1",
      modules: [
        {
          id: "module-1",
          position: 0,
          topics: [
            { id: "topic-1", position: 0 },
            { id: "topic-2", position: 1 },
          ],
        },
        { id: "module-2", position: 1, topics: [{ id: "topic-3", position: 0 }] },
      ],
    };
    client.setQueryData(queryKey, initialProgram);
    mocks.put.mockResolvedValueOnce({ error: { code: "INVALID_ORDER" }, response: { status: 400 } });
    const { result } = renderHook(() => useReorderLearningProgramTopicsMutation("program-1", "module-1"), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.mutate({ orderedIds: ["topic-2", "topic-1"] }));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mocks.put).toHaveBeenCalledWith("/api/v1/teacher/programs/{programId}/modules/{moduleId}/topics/order", {
      params: { path: { programId: "program-1", moduleId: "module-1" } },
      body: { orderedIds: ["topic-2", "topic-1"] },
    });
    expect(client.getQueryData(queryKey)).toEqual(initialProgram);
  });
});
