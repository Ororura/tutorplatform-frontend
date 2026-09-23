import { describe, expect, it, vi, beforeEach } from "vitest";

import { apiTransport, ApiClientError } from "@/shared/api/client";

import { deleteMaterial } from "./delete-material";

vi.mock("@/shared/api/client", () => ({
  apiTransport: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    constructor(
      public status: number,
      public body: { message: string },
    ) {
      super(body.message);
    }
  },
}));

describe("deleteMaterial", () => {
  beforeEach(() => vi.mocked(apiTransport).mockReset());

  it("uses the CSRF-aware transport and accepts 204 without a response body", async () => {
    vi.mocked(apiTransport).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteMaterial("topic-id", "material-id")).resolves.toBeUndefined();
    expect(apiTransport).toHaveBeenCalledWith("/api/v1/teacher/topics/topic-id/materials/material-id", {
      method: "DELETE",
    });
  });

  it("does not swallow a 404", async () => {
    vi.mocked(apiTransport).mockResolvedValue(
      new Response(JSON.stringify({ code: "NOT_FOUND", message: "Missing", details: [] }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const action = deleteMaterial("topic", "material");
    await expect(action).rejects.toBeInstanceOf(ApiClientError);
    await expect(action).rejects.toMatchObject({ status: 404 });
  });

  it("builds a useful error when backend returns no JSON", async () => {
    vi.mocked(apiTransport).mockResolvedValue(new Response(null, { status: 500 }));
    await expect(deleteMaterial("topic", "material")).rejects.toMatchObject({
      status: 500,
      body: { code: "HTTP_ERROR" },
    });
  });
});
