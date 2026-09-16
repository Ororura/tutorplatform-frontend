import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";
import { getStudentSession, getStudentSessions, sessionQueries } from "./session-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { GET: vi.fn() },
}));
const getMock = vi.mocked(apiClient.GET);

describe("sessionQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("includes studentId and server pagination/sort in request and query key", async () => {
    const data = { items: [], page: 2, size: 20, totalElements: 0, totalPages: 0 } as never;
    getMock.mockResolvedValue({ data, error: undefined, response: new Response(null, { status: 200 }) });
    await getStudentSessions("student-alex", { page: 2, sort: "startedAt,desc" });
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/sessions", {
      params: {
        path: { studentId: "student-alex" },
        query: { page: 2, sort: "startedAt,desc" },
      },
    });
    expect(sessionQueries.list("student-alex", { page: 0 }).queryKey).not.toEqual(
      sessionQueries.list("student-maria", { page: 0 }).queryKey,
    );
  });

  it("uses both identifiers for detail", async () => {
    getMock.mockResolvedValue({
      data: { id: "session-1" } as never,
      error: undefined,
      response: new Response(null, { status: 200 }),
    });
    await getStudentSession("student-1", "session-1");
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/sessions/{sessionId}", {
      params: {
        path: {
          studentId: "student-1",
          sessionId: "session-1",
        },
      },
    });
  });
});
