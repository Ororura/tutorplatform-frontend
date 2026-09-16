import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { localDateTimeToIso } from "@/entities/session";
import { HomeworkForm } from "./homework-form";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  pending: false,
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, back: mocks.back }) }));
vi.mock("../api/homework-mutations", () => ({
  useCreateHomeworkMutation: () => ({
    mutateAsync: mocks.create,
    isPending: mocks.pending,
  }),
  useUpdateHomeworkMutation: () => ({ mutateAsync: mocks.update, isPending: false }),
}));

const program = (id: string, title: string) => ({
  id,
  learningProgramId: `learning-${id}`,
  title,
  status: "ACTIVE",
  reportIntervalMinutes: 480,
  startedAt: "2026-09-01T00:00:00Z",
  subject: { id: `subject-${id}`, name: `Предмет ${id}` },
});
const task = (id: string, title: string, taskType: "TEXT" | "CODE") => ({
  id,
  subjectId: "subject-p1",
  title,
  descriptionMarkdown: "Описание",
  taskType,
  difficulty: id === "text" ? "EASY" : "MEDIUM",
  status: "ACTIVE",
  version: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});
const queryResult = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
});
const taskPage = {
  items: [task("text", "Текст", "TEXT"), task("code", "Код", "CODE")],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
};

describe("HomeworkForm", () => {
  let programs = [program("p1", "Python")];
  beforeEach(() => {
    programs = [program("p1", "Python")];
    mocks.create.mockReset().mockResolvedValue({ id: "homework-new" });
    mocks.update.mockReset();
    mocks.push.mockReset();
    mocks.pending = false;
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[]; enabled?: boolean }) =>
      options?.queryKey?.includes("student-programs") ? queryResult(programs) : queryResult(taskPage),
    );
  });

  it("blocks creation without a StudentProgram and links to Program", () => {
    programs = [];
    render(<HomeworkForm studentId="alex" />);
    expect(screen.getByText("Сначала назначьте ученику программу обучения")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Назначить" })).not.toBeInTheDocument();
  });

  it("auto-selects one program but requires an explicit choice when there are several", async () => {
    const { unmount } = render(<HomeworkForm studentId="alex" />);
    expect(screen.getByLabelText("Программа обучения")).toHaveValue("p1");
    unmount();
    programs = [program("p1", "Python"), program("p2", "Алгоритмы")];
    render(<HomeworkForm studentId="alex" />);
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
    expect((await screen.findAllByText("Выберите программу")).at(-1)).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("sends atomic ordered items, required flags, title, description and ISO dueAt", async () => {
    render(<HomeworkForm studentId="alex" />);
    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Практика" } });
    fireEvent.change(screen.getByLabelText("Описание"), { target: { value: "Два задания" } });
    fireEvent.change(screen.getByLabelText("Срок"), { target: { value: "2026-09-20T18:30" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Текст/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Код/ }));
    const required = screen.getAllByRole("checkbox", { name: "Обязательное" });
    fireEvent.click(required[1]);
    fireEvent.click(screen.getByRole("button", { name: "Поднять Код" }));
    fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        studentProgramId: "p1",
        title: "Практика",
        description: "Два задания",
        dueAt: localDateTimeToIso("2026-09-20T18:30"),
        items: [
          { taskId: "code", required: false, position: 0 },
          { taskId: "text", required: true, position: 1 },
        ],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/teacher/students/alex/homework/homework-new");
  });

  it("disables double submit while saving", () => {
    mocks.pending = true;
    render(<HomeworkForm studentId="alex" />);
    expect(screen.getByRole("button", { name: "Сохраняем…" })).toBeDisabled();
  });
});
