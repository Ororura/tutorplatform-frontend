import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLearningPrograms } from "./learning-program-queries";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/shared/api/client", () => ({
  apiClient: {
    GET: mocks.get,
  },
  ApiClientError: class ApiClientError extends Error {},
}));

describe("getLearningPrograms", () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.get.mockResolvedValue({
      data: [],
      error: undefined,
      response: { status: 200 },
    });
  });

  it("loads all teacher programs when status is omitted", async () => {
    await getLearningPrograms();

    expect(mocks.get).toHaveBeenCalledWith("/api/v1/teacher/programs", {
      params: {
        query: {},
      },
    });
  });

  it("passes status filter to backend", async () => {
    await getLearningPrograms("ACTIVE");

    expect(mocks.get).toHaveBeenCalledWith("/api/v1/teacher/programs", {
      params: {
        query: {
          status: "ACTIVE",
        },
      },
    });
  });
});
