import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/shared/api/client")>(),
  apiClient: { POST: mocks.post },
}));

import { CreateStudentForm } from "./create-student-form";

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const onSuccess = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(<CreateStudentForm onSuccess={onSuccess} />, { wrapper: Wrapper });
  return { invalidate, onSuccess };
}

describe("CreateStudentForm", () => {
  beforeEach(() => mocks.post.mockReset());

  it("validates the required first name before calling the backend", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Добавить ученика" }));
    expect(await screen.findByText("Введите имя")).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("creates using the generated contract and invalidates the student list", async () => {
    mocks.post.mockResolvedValue({
      data: { id: "student-1", firstName: "Илья", status: "ACTIVE", accountStatus: "UNREGISTERED", createdAt: "2026-09-13T00:00:00Z" },
      response: { status: 201 },
    });
    const { invalidate, onSuccess } = setup();
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Илья" } });
    fireEvent.change(screen.getByLabelText("Фамилия"), { target: { value: "Соколов" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить ученика" }));

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith(
      "/api/v1/teacher/students",
      { body: { firstName: "Илья", lastName: "Соколов" } },
    ));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["students", "list"] }));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("shows backend validation details next to the field", async () => {
    mocks.post.mockResolvedValue({
      error: {
        code: "VALIDATION_FAILED",
        message: "Проверьте введённые данные",
        timestamp: "2026-09-13T00:00:00Z",
        traceId: "trace",
        details: [{ field: "firstName", message: "Недопустимое имя" }],
      },
      response: { status: 400 },
    });
    setup();
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Илья" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить ученика" }));
    expect(await screen.findByText("Недопустимое имя")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Проверьте введённые данные");
  });

  it("blocks a second submit while the mutation is pending", async () => {
    let finish!: (value: unknown) => void;
    mocks.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    setup();
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Илья" } });
    const submit = screen.getByRole("button", { name: "Добавить ученика" });
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByRole("button", { name: "Создаём…" })).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Создаём…" }));
    expect(mocks.post).toHaveBeenCalledOnce();
    finish({
      data: { id: "student-1", firstName: "Илья", status: "ACTIVE", accountStatus: "UNREGISTERED", createdAt: "2026-09-13T00:00:00Z" },
      response: { status: 201 },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Добавить ученика" })).toBeEnabled());
  });
});
