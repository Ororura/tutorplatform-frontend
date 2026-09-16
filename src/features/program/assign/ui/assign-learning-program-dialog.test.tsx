import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssignLearningProgramDialog } from "./assign-learning-program-dialog";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiClient: { GET: mocks.get, POST: mocks.post },
}));

const activeTemplate = {
  id: "learning-1",
  subject: { id: "subject-1", code: "PYTHON", name: "Python" },
  title: "Python с нуля",
  description: "Базовый курс",
  status: "ACTIVE",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

const assigned = {
  id: "student-program-old",
  learningProgramId: "learning-1",
  title: "Python с нуля",
  status: "ACTIVE",
  reportIntervalMinutes: 480,
  startedAt: "2026-09-01T00:00:00Z",
  subject: { id: "subject-1", name: "Python" },
};

function response(data: unknown, status = 200) {
  return { data, error: undefined, response: new Response(null, { status }) };
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const onAssigned = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(
    <AssignLearningProgramDialog
      studentId="student-from-route"
      triggerLabel="Назначить программу"
      onAssigned={onAssigned}
    />,
    { wrapper: Wrapper },
  );
  return { client, invalidate, onAssigned };
}

function mockLists(templates: unknown[], assignments: unknown[] = []) {
  mocks.get.mockImplementation((path: string) => {
    if (path === "/api/v1/teacher/programs") return Promise.resolve(response(templates));
    return Promise.resolve(response(assignments));
  });
}

describe("AssignLearningProgramDialog", () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
  });

  it("opens and does not show an empty state while templates are loading", async () => {
    mocks.get.mockReturnValue(new Promise(() => undefined));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    expect(screen.getByRole("dialog", { name: "Назначить программу" })).toBeInTheDocument();
    expect(screen.getByText("Загружаем доступные программы…")).toBeInTheDocument();
    expect(screen.queryByText("Нет программ, доступных для назначения")).not.toBeInTheDocument();
  });

  it("shows the empty ACTIVE template state", async () => {
    mockLists([]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    expect(await screen.findByText("Нет программ, доступных для назначения")).toBeInTheDocument();
  });

  it("renders an active template and disables an active existing assignment", async () => {
    mockLists([activeTemplate], [assigned]);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    expect(await screen.findByText("Базовый курс")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Python с нуля/ })).toBeDisabled();
    expect(screen.getByText("Уже назначена")).toBeInTheDocument();
  });

  it("sends the selected id, route student id and converted interval, then invalidates and returns the created id", async () => {
    mockLists([activeTemplate]);
    const created = { ...assigned, id: "student-program-new" };
    mocks.post.mockResolvedValue(response(created, 201));
    const { invalidate, onAssigned } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Python с нуля/ }));
    fireEvent.change(screen.getByLabelText("Интервал отчёта, часов"), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/api/v1/teacher/students/{studentId}/programs", {
        params: { path: { studentId: "student-from-route" } },
        body: { learningProgramId: "learning-1", reportIntervalMinutes: 90 },
      }),
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["student-programs", "list", "student-from-route"] }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["student-programs", "detail", "student-from-route"] });
    expect(onAssigned).toHaveBeenCalledWith(created);
  });

  it("blocks double submit while assignment is pending", async () => {
    mockLists([activeTemplate]);
    let finish!: (value: unknown) => void;
    mocks.post.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Python с нуля/ }));
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Назначаем…" })).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Назначаем…" }));
    expect(mocks.post).toHaveBeenCalledOnce();
    finish(response({ ...assigned, id: "student-program-new" }, 201));
  });

  it("shows a friendly duplicate conflict and refreshes assignments", async () => {
    mockLists([activeTemplate]);
    mocks.post.mockResolvedValue({
      error: {
        code: "STUDENT_PROGRAM_ALREADY_ASSIGNED",
        message: "conflict",
        timestamp: "2026-09-01",
        traceId: "t",
        details: [],
      },
      response: new Response(null, { status: 409 }),
    });
    const { invalidate } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Python с нуля/ }));
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Эта программа уже назначена ученику");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["student-programs", "list", "student-from-route"] });
  });

  it("keeps the dialog open and refreshes stale templates after a 404", async () => {
    mockLists([activeTemplate]);
    mocks.post.mockResolvedValue({
      error: {
        code: "LEARNING_PROGRAM_NOT_FOUND",
        message: "missing",
        timestamp: "2026-09-01",
        traceId: "t",
        details: [],
      },
      response: new Response(null, { status: 404 }),
    });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Python с нуля/ }));
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Программа больше недоступна");
    expect(screen.getByRole("dialog", { name: "Назначить программу" })).toBeInTheDocument();
    await waitFor(() => expect(mocks.get.mock.calls.length).toBeGreaterThanOrEqual(4));
  });

  it("shows backend interval validation beside the field", async () => {
    mockLists([activeTemplate]);
    mocks.post.mockResolvedValue({
      error: {
        code: "VALIDATION_ERROR",
        message: "invalid",
        timestamp: "2026-09-01",
        traceId: "t",
        details: [{ field: "reportIntervalMinutes", message: "Должно быть больше нуля" }],
      },
      response: new Response(null, { status: 400 }),
    });
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Назначить программу" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Python с нуля/ }));
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
    expect(await screen.findByText("Должно быть больше нуля")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Проверьте интервал отчёта");
  });
});
