import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { learningProgramQueries } from "@/entities/learning-program";
import { ApiClientError } from "@/shared/api/client";

import { useDuplicateLearningProgramMutation } from "../model/use-duplicate-learning-program-mutation";
import { duplicateLearningProgram } from "./duplicate-learning-program";

const mocks = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post, GET: mocks.get },
}));

describe("learning program duplication", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.get.mockReset();
  });

  it("returns the created summary from the generated duplicate endpoint", async () => {
    const created = { id: "copy-id", slug: "algebra-copy", status: "DRAFT" };
    mocks.post.mockResolvedValue({ data: created, response: { status: 201 } });

    await expect(duplicateLearningProgram("program-1")).resolves.toBe(created);
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith("/api/v1/teacher/programs/{programId}/duplicate", {
      params: { path: { programId: "program-1" } },
    });
  });

  it("invalidates all program lists and includes the copy on the next fetch", async () => {
    const created = { id: "copy-id", slug: "algebra-copy", status: "DRAFT" };
    mocks.post.mockResolvedValue({ data: created, response: { status: 201 } });
    mocks.get.mockResolvedValue({ data: [created], response: { status: 200 } });
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity }, mutations: { retry: false } },
    });
    const lists = [
      learningProgramQueries.list(),
      learningProgramQueries.list("DRAFT"),
      learningProgramQueries.list("ACTIVE"),
    ];
    lists.forEach((query) => client.setQueryData(query.queryKey, []));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDuplicateLearningProgramMutation(), { wrapper });

    await act(async () => {
      expect(await result.current.mutateAsync("program-1")).toBe(created);
    });

    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: learningProgramQueries.lists() });
    lists.forEach((query) => expect(client.getQueryState(query.queryKey)?.isInvalidated).toBe(true));
    await client.fetchQuery(learningProgramQueries.list());
    expect(client.getQueryData(learningProgramQueries.list().queryKey)).toEqual([created]);
  });

  it("preserves API errors and does not invalidate lists on failure", async () => {
    const body = { message: "Program not found" };
    mocks.post.mockResolvedValue({ error: body, response: { status: 404 } });
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDuplicateLearningProgramMutation(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("missing")).rejects.toMatchObject({
        name: "ApiClientError",
        status: 404,
        body,
      });
    });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiClientError));
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });
});
