import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sessionQueries } from "@/entities/session";
import { apiClient } from "@/shared/api/client";
import { useCreateSessionMutation, useUpdateSessionMutation } from "./session-mutations";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { POST: vi.fn(), PATCH: vi.fn() },
}));
const created = {
  id: "session-1",
  studentProgramId: "program-1",
  startedAt: "2026-09-14T13:30:00Z",
  durationMinutes: 60,
  attendanceStatus: "ATTENDED",
  topics: [],
  createdAt: "2026-09-14T13:30:00Z",
  updatedAt: "2026-09-14T13:30:00Z",
  version: 0,
} as never;

describe("session mutations", () => {
  let client: QueryClient;
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.mocked(apiClient.POST).mockReset();
    vi.mocked(apiClient.PATCH).mockReset();
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  it("creates with the generated endpoint and invalidates only this student's lists", async () => {
    vi.mocked(apiClient.POST).mockResolvedValue({
      data: created,
      error: undefined,
      response: new Response(null, { status: 201 }),
    });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateSessionMutation("student-1"), { wrapper });
    const body = {
      studentProgramId: "program-1",
      startedAt: "2026-09-14T13:30:00Z",
      durationMinutes: 60,
      attendanceStatus: "ATTENDED" as const,
      topics: [],
    };
    await act(() => result.current.mutateAsync(body));
    expect(apiClient.POST).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/sessions", {
      params: { path: { studentId: "student-1" } },
      body,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: sessionQueries.studentLists("student-1") });
    expect(client.getQueryData(sessionQueries.detail("student-1", "session-1").queryKey)).toEqual(created);
  });

  it("updates via PATCH and refreshes list and detail", async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: created,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useUpdateSessionMutation("student-1", "session-1"), { wrapper });
    const body = {
      startedAt: "2026-09-14T13:30:00Z",
      durationMinutes: 60,
      attendanceStatus: "ATTENDED" as const,
      version: 0,
      topics: [],
    };
    await act(() => result.current.mutateAsync(body));
    expect(apiClient.PATCH).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/sessions/{sessionId}", {
      params: {
        path: {
          studentId: "student-1",
          sessionId: "session-1",
        },
      },
      body,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: sessionQueries.studentLists("student-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: sessionQueries.detail("student-1", "session-1").queryKey });
  });
});
