import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/shared/api/client";

import { getLearningPrograms, learningProgramQueries } from "./learning-program-queries";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiClient: { GET: vi.fn() },
}));

const getMock = vi.mocked(apiClient.GET);

describe("learningProgramQueries", () => {
  beforeEach(() => getMock.mockReset());

  it("requests only the backend ACTIVE set used by assignment", async () => {
    getMock.mockResolvedValue({ data: [], error: undefined, response: new Response(null, { status: 200 }) });

    await expect(getLearningPrograms("ACTIVE")).resolves.toEqual([]);
    expect(getMock).toHaveBeenCalledWith("/api/v1/teacher/programs", {
      params: { query: { status: "ACTIVE" } },
    });
    expect(learningProgramQueries.list("ACTIVE").queryKey).toEqual(["learning-programs", "list", "ACTIVE"]);
  });
});
