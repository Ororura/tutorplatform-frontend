import { beforeEach, describe, expect, it, vi } from "vitest";

import { getProgressShares, progressShareQueries } from "./progress-share-queries";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { GET: mocks.get },
}));

describe("progressShareQueries", () => {
  beforeEach(() => mocks.get.mockReset());

  it("loads metadata for a specific student program without expecting a share URL", async () => {
    const items = [
      {
        id: "share-1",
        studentProgramId: "program-1",
        status: "ACTIVE" as const,
        createdAt: "2026-09-22T10:00:00Z",
      },
    ];
    mocks.get.mockResolvedValue({ data: { items }, response: { status: 200 } });

    await expect(getProgressShares("student-1", "program-1")).resolves.toEqual(items);
    expect(mocks.get).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/progress/shares", {
      params: {
        path: { studentId: "student-1" },
        query: { studentProgramId: "program-1" },
      },
    });
    expect(progressShareQueries.list("student-1", "program-1").queryKey).toEqual([
      "progress-shares",
      "student",
      "student-1",
      "program",
      "program-1",
    ]);
  });
});
