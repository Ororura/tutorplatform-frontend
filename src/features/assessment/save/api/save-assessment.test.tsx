import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { assessmentQueries } from "@/entities/assessment";
import { apiClient } from "@/shared/api/client";

import { useSaveAssessmentMutation } from "./save-assessment";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { PUT: vi.fn() },
}));

const saved = {
  id: "assessment-1",
  lessonSessionId: "session-1",
  understandingScore: 4,
  createdAt: "2026-09-14T14:30:00Z",
  updatedAt: "2026-09-14T14:30:00Z",
} as never;

describe("assessment mutation", () => {
  let client: QueryClient;
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    vi.mocked(apiClient.PUT).mockReset();
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  it("uses PUT and replaces the assessment query cache", async () => {
    vi.mocked(apiClient.PUT).mockResolvedValue({
      data: saved,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
    const { result } = renderHook(() => useSaveAssessmentMutation("student-1", "session-1"), { wrapper });
    const body = { understandingScore: 4 };
    await act(() => result.current.mutateAsync(body));

    expect(apiClient.PUT).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/sessions/{sessionId}/assessment", {
      params: { path: { studentId: "student-1", sessionId: "session-1" } },
      body,
    });
    expect(client.getQueryData(assessmentQueries.detail("student-1", "session-1").queryKey)).toEqual(saved);
  });
});
