import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), create: vi.fn(), update: vi.fn(), push: vi.fn(), back: vi.fn(), createPending: false }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, back: mocks.back }) }));
vi.mock("../api/session-mutations", () => ({
  useCreateSessionMutation: () => ({ mutateAsync: mocks.create, isPending: mocks.createPending }),
  useUpdateSessionMutation: () => ({ mutateAsync: mocks.update, isPending: false }),
}));

import { localDateTimeToIso } from "@/entities/session";
import { ApiClientError } from "@/shared/api/client";
import { SessionForm } from "./session-form";

const program = (id: string, title: string) => ({ id, learningProgramId: `learning-${id}`, title, status: "ACTIVE", reportIntervalMinutes: 480, startedAt: "2026-09-01T00:00:00Z", subject: { id: "subject-1", name: "Информатика" } });
const details = (id: string, moduleTitle = "Основы Python", topicTitle = "Переменные") => ({ ...program(id, id === "p1" ? "Python" : "Алгоритмы"), modules: [{ id: `module-${id}`, title: moduleTitle, position: 0, topics: [{ id: `topic-${id}`, title: topicTitle, position: 0, topicStatus: "ACTIVE", progressStatus: "AVAILABLE" }] }] });
const programDetails = { p1: details("p1"), p2: details("p2", "Управление программой", "Условия") };
const existingSession = { id: "session-1", studentProgramId: "p1", startedAt: "2026-09-14T13:30:00Z", durationMinutes: 45, attendanceStatus: "ATTENDED" as const, summary: "Было", privateNotes: "Личное", topics: [{ topicId: "topic-p1", isPrimary: true }], createdAt: "2026-09-14T13:30:00Z", updatedAt: "2026-09-14T13:30:00Z", version: 7 };
const queryResult = (data: unknown, overrides: Record<string, unknown> = {}) => ({ data, isPending: false, isError: false, refetch: vi.fn(), ...overrides });

describe("SessionForm", () => {
  let programList: ReturnType<typeof program>[];
  beforeEach(() => {
    programList = [program("p1", "Python")];
    mocks.create.mockReset().mockResolvedValue({ id: "session-new" });
    mocks.update.mockReset(); mocks.push.mockReset(); mocks.back.mockReset(); mocks.createPending = false;
    mocks.useQuery.mockImplementation((options: { queryKey: unknown[]; enabled?: boolean }) => {
      if (options.queryKey.includes("list")) return queryResult(programList);
      const id = String(options.queryKey.at(-1));
      return options.enabled === false ? queryResult(undefined, { isPending: false }) : queryResult(programDetails[id as keyof typeof programDetails] ?? programDetails.p1);
    });
  });

  it("blocks creation and links to Program when assignments are empty", () => {
    programList = [];
    render(<SessionForm studentId="student-1" />);
    expect(screen.getByText("Сначала назначьте ученику программу обучения")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Создать занятие" })).not.toBeInTheDocument();
  });

  it("auto-selects the only program while keeping the field explicit", async () => {
    render(<SessionForm studentId="student-1" />);
    await waitFor(() => expect(screen.getByLabelText("Программа обучения")).toHaveValue("p1"));
    expect(screen.getByText("Основы Python")).toBeInTheDocument();
  });

  it("requires explicit selection when multiple programs exist", async () => {
    programList = [program("p1", "Python"), program("p2", "Алгоритмы")];
    render(<SessionForm studentId="student-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Создать занятие" }));
    expect((await screen.findAllByText("Выберите программу")).at(-1)).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("groups topics by module and clears stale topics on program change", async () => {
    programList = [program("p1", "Python"), program("p2", "Алгоритмы")];
    render(<SessionForm studentId="student-1" />);
    fireEvent.change(screen.getByLabelText("Программа обучения"), { target: { value: "p1" } });
    fireEvent.click(await screen.findByRole("checkbox", { name: "Переменные" }));
    fireEvent.click(screen.getByRole("radio", { name: "Основная тема" }));
    expect(screen.getByText("Основы Python")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Программа обучения"), { target: { value: "p2" } });
    expect(await screen.findByRole("checkbox", { name: "Условия" })).not.toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "Переменные" })).not.toBeInTheDocument();
  });

  it("validates duration 1..600", async () => {
    render(<SessionForm studentId="student-1" />);
    fireEvent.change(screen.getByLabelText("Длительность, минут"), { target: { value: "601" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать занятие" }));
    expect(await screen.findByText("Введите целое число от 1 до 600")).toBeInTheDocument();
  });

  it("sends generated request fields, selected topic and primary marker", async () => {
    render(<SessionForm studentId="student-1" />);
    await waitFor(() => expect(screen.getByLabelText("Программа обучения")).toHaveValue("p1"));
    fireEvent.change(screen.getByLabelText("Дата и время"), { target: { value: "2026-09-14T16:30" } });
    fireEvent.change(screen.getByLabelText("Длительность, минут"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("radio", { name: /Пропущено/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Переменные" }));
    fireEvent.click(screen.getByRole("radio", { name: "Основная тема" }));
    fireEvent.change(screen.getByLabelText("Краткое описание занятия"), { target: { value: "Повторили типы" } });
    fireEvent.change(screen.getByLabelText("Личные заметки"), { target: { value: "Нужна практика" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать занятие" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({
      studentProgramId: "p1",
      startedAt: localDateTimeToIso("2026-09-14T16:30"),
      durationMinutes: 90,
      attendanceStatus: "MISSED",
      summary: "Повторили типы",
      privateNotes: "Нужна практика",
      topics: [{ topicId: "topic-p1", isPrimary: true }],
    }));
    expect(mocks.push).toHaveBeenCalledWith("/teacher/students/student-1/sessions/session-new");
  });

  it("disables submit while mutation is pending", () => {
    mocks.createPending = true;
    render(<SessionForm studentId="student-1" />);
    expect(screen.getByRole("button", { name: "Сохраняем…" })).toBeDisabled();
  });

  it("loads edit values and sends only update DTO fields with version", async () => {
    mocks.update.mockResolvedValue({ ...existingSession, durationMinutes: 75 });
    render(<SessionForm studentId="student-1" session={existingSession} />);
    expect(screen.getByLabelText("Программа обучения")).toBeDisabled();
    expect(screen.getByLabelText("Краткое описание занятия")).toHaveValue("Было");
    fireEvent.change(screen.getByLabelText("Длительность, минут"), { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0]).toMatchObject({ durationMinutes: 75, version: 7, topics: [{ topicId: "topic-p1", isPrimary: true }] });
    expect(mocks.update.mock.calls[0][0]).not.toHaveProperty("studentProgramId");
  });

  it("shows optimistic-lock conflict guidance", async () => {
    mocks.update.mockRejectedValue(new ApiClientError(409, { code: "LESSON_SESSION_VERSION_CONFLICT", message: "internal", timestamp: "2026-01-01T00:00:00Z", traceId: "x", details: [] }));
    render(<SessionForm studentId="student-1" session={existingSession} />);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Занятие было изменено. Обновите данные и повторите.");
    expect(screen.getByRole("button", { name: "Обновить данные" })).toBeInTheDocument();
  });
});
