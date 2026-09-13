import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ post: vi.fn(), writeText: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/shared/api/client")>(),
  apiClient: { POST: mocks.post },
}));

import { CreateStudentInviteForm } from "./create-student-invite-form";

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(<CreateStudentInviteForm studentId="student-1" />, { wrapper: Wrapper });
  return { invalidate };
}

describe("CreateStudentInviteForm", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: mocks.writeText } });
  });

  it("creates an invitation, shows the one-time URL, and copies it", async () => {
    const inviteUrl = "http://localhost:3000/invite/student/raw-secret";
    mocks.post.mockResolvedValue({
      data: { id: "invite-1", studentId: "student-1", email: "ilya@example.com", inviteUrl, expiresAt: "2026-09-20T00:00:00Z", createdAt: "2026-09-13T00:00:00Z" },
      response: { status: 201 },
    });
    const { invalidate } = setup();
    fireEvent.change(screen.getByLabelText("Email ученика"), { target: { value: "ilya@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать приглашение" }));

    expect(await screen.findByDisplayValue(inviteUrl)).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith(
      "/api/v1/teacher/students/{studentId}/invites",
      { params: { path: { studentId: "student-1" } }, body: { email: "ilya@example.com" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Копировать" }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith(inviteUrl));
    expect(await screen.findByRole("button", { name: "Скопировано" })).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalled();
    expect(document.body).not.toHaveTextContent("tokenHash");
  });

  it("validates email without a backend request", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("Email ученика"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать приглашение" }));
    expect(await screen.findByText("Введите корректный email")).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("shows a readable conflict error", async () => {
    mocks.post.mockResolvedValue({
      error: { code: "EMAIL_ALREADY_REGISTERED", message: "Conflict", timestamp: "2026-09-13T00:00:00Z", traceId: "trace", details: [] },
      response: { status: 409 },
    });
    setup();
    fireEvent.change(screen.getByLabelText("Email ученика"), { target: { value: "ilya@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать приглашение" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Этот email уже используется");
    expect(screen.queryByText("HTTP 409")).not.toBeInTheDocument();
  });
});
