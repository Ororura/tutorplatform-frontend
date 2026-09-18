import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentHomeworkDetailView } from "./student-homework-detail-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), solution: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/entities/homework", () => ({
  studentHomeworkQueries: { detail: (id: string) => ({ queryKey: ["student-homework", "detail", id] }) },
  getStudentHomeworkPresentationState: (value: { status: string; overdue: boolean }) =>
    value.status === "ASSIGNED" && value.overdue ? "OVERDUE" : value.status,
  studentHomeworkStatusPresentation: {
    ASSIGNED: "Нужно выполнить",
    OVERDUE: "Просрочено",
    COMPLETED: "Выполнено",
    CANCELLED: "Отменено",
  },
  formatHomeworkDate: () => "1 сентября 2026",
}));
vi.mock("./student-task-solution", () => ({
  StudentTaskSolution: (props: { item: { task: { title: string } } }) => (
    <div data-testid="solution">{props.item.task.title}</div>
  ),
}));

const homework = {
  id: "homework-1",
  studentProgramId: "program-1",
  title: "Практика Python",
  description: "Выполните задания по порядку.",
  status: "ASSIGNED" as const,
  assignedAt: "2026-09-01T10:00:00Z",
  dueAt: "2026-09-20T10:00:00Z",
  overdue: false,
  items: [
    {
      id: "second",
      taskId: "task-code",
      position: 1,
      required: false,
      passed: true,
      latestSubmissionStatus: "PASSED" as const,
      task: {
        id: "task-code",
        title: "Второе задание",
        descriptionMarkdown: "D",
        taskType: "CODE" as const,
        difficulty: "EASY" as const,
      },
    },
    {
      id: "first",
      taskId: "task-text",
      position: 0,
      required: true,
      passed: false,
      latestSubmissionStatus: "NEEDS_REVIEW" as const,
      task: {
        id: "task-text",
        title: "Первое задание",
        descriptionMarkdown: "D",
        taskType: "TEXT" as const,
        difficulty: "EASY" as const,
      },
    },
    {
      id: "unsupported",
      taskId: "task-file",
      position: 2,
      required: false,
      passed: false,
      task: {
        id: "task-file",
        title: "Файл",
        descriptionMarkdown: "D",
        taskType: "FILE_UPLOAD" as const,
        difficulty: "EASY" as const,
      },
    },
  ],
};

describe("StudentHomeworkDetailView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValue({ data: homework, isPending: false, isError: false, refetch: vi.fn() });
  });

  it("renders ordered item states and opens a supported task inside homework context", () => {
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    const itemTitles = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(itemTitles).toEqual(["Первое задание", "Второе задание", "Файл"]);
    expect(screen.getByText("Обязательное")).toBeInTheDocument();
    expect(screen.getAllByText("Дополнительное")).toHaveLength(2);
    expect(screen.getByText("Ожидает проверки")).toBeInTheDocument();
    const taskList = screen.getByRole("list", {
      name: "Задания",
    });

    expect(within(taskList).getByText("Выполнено")).toBeInTheDocument();
    expect(screen.getByText("Пока не поддерживается")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Решить" })[0]);
    expect(screen.getByTestId("solution")).toHaveTextContent("Первое задание");
  });

  it("shows safe not-found state for an owned homework lookup", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { status: 404 },
      refetch: vi.fn(),
    });
    render(<StudentHomeworkDetailView homeworkId="missing" />);
    expect(screen.getByText("Домашнее задание не найдено")).toBeInTheDocument();
  });
});
