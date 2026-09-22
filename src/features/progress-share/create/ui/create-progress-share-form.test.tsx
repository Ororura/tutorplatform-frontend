import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateProgressShareForm } from "./create-progress-share-form";

const mocks = vi.hoisted(() => ({ post: vi.fn(), writeText: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { POST: mocks.post },
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return {
    invalidate,
    ...render(<CreateProgressShareForm studentId="student-1" studentProgramId="program-1" />, { wrapper }),
  };
}

describe("CreateProgressShareForm", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.writeText.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: mocks.writeText },
    });
  });

  it("creates a program-specific expiring share, exposes its one-time URL and copies it", async () => {
    mocks.post.mockResolvedValue({
      data: {
        id: "share-1",
        studentProgramId: "program-1",
        expiresAt: "2026-10-01T09:30:00.000Z",
        shareUrl: "https://example.test/public/progress/secret-token",
        createdAt: "2026-09-22T10:00:00Z",
      },
      response: { status: 201 },
    });
    mocks.writeText.mockResolvedValue(undefined);
    const { invalidate } = renderForm();

    fireEvent.change(screen.getByLabelText("Дата истечения (необязательно)"), {
      target: { value: "2026-10-01T09:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Создать публичную ссылку" }));

    await screen.findByText("Публичная ссылка создана");
    expect(mocks.post).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/progress/shares", {
      params: { path: { studentId: "student-1" } },
      body: {
        studentProgramId: "program-1",
        expiresAt: new Date("2026-10-01T09:30").toISOString(),
      },
    });
    expect(screen.getByLabelText("Публичная ссылка на прогресс")).toHaveValue(
      "https://example.test/public/progress/secret-token",
    );

    fireEvent.click(screen.getByRole("button", { name: "Копировать" }));
    await waitFor(() =>
      expect(mocks.writeText).toHaveBeenCalledWith("https://example.test/public/progress/secret-token"),
    );
    expect(await screen.findByRole("button", { name: "Скопировано" })).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["progress-shares", "student", "student-1", "program", "program-1"],
    });
  });

  it("creates a share without an expiration date", async () => {
    mocks.post.mockResolvedValue({
      data: {
        id: "share-2",
        studentProgramId: "program-1",
        shareUrl: "https://example.test/public/progress/another-token",
        createdAt: "2026-09-22T10:00:00Z",
      },
      response: { status: 201 },
    });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Создать публичную ссылку" }));

    await screen.findByText("Публичная ссылка создана");
    expect(mocks.post).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/progress/shares", {
      params: { path: { studentId: "student-1" } },
      body: { studentProgramId: "program-1" },
    });
  });
});
