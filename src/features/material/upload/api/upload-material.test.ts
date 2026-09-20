import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiTransport } from "@/shared/api/client";

import { uploadMaterial } from "./upload-material";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiTransport: vi.fn(),
}));

const transportMock = vi.mocked(apiTransport);

describe("uploadMaterial", () => {
  beforeEach(() => transportMock.mockReset());

  it("sends every field in FormData through the CSRF-aware transport without setting Content-Type", async () => {
    transportMock.mockResolvedValue(new Response(JSON.stringify({ id: "material-1" }), { status: 201 }));
    const file = new File(["pdf"], "guide.pdf", { type: "application/pdf" });

    await expect(
      uploadMaterial("topic-1", { materialType: "FILE", title: "Guide", position: 4, file }),
    ).resolves.toEqual({ id: "material-1" });

    const [url, init] = transportMock.mock.calls[0];
    expect(url).toBe("/api/v1/teacher/topics/topic-1/materials/upload");
    expect(init).toMatchObject({ method: "POST" });
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get("materialType")).toBe("FILE");
    expect(body.get("title")).toBe("Guide");
    expect(body.get("position")).toBe("4");
    expect(body.get("file")).toBe(file);
  });
});
