import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatHomeworkDate } from "@/entities/homework";

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
vi.mock("@/widgets/student-task-solution", () => ({
  StudentTaskSolution: (props: { item: { task: { title: string } } }) => (
    <div data-testid="solution">
      {mocks.solution(props)}
      {props.item.task.title}
    </div>
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
    mocks.solution.mockReset();
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

    expect(within(taskList).getAllByText("Выполнено")[0]).toBeInTheDocument();
    expect(screen.getByText("Пока не поддерживается")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /^Открыть:/ })[0]);
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

  it("renders real header, dates, description and back navigation", () => {
    mocks.useQuery.mockReturnValue({ data: { ...homework, status: "COMPLETED", completedAt: "2026-09-21T10:00:00Z" } });
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(homework.title);
    expect(screen.getByText("Назначено")).toBeInTheDocument();
    expect(screen.getByText(formatHomeworkDate(homework.assignedAt))).toBeInTheDocument();
    expect(screen.getByText("Срок")).toBeInTheDocument();
    expect(screen.getByText(formatHomeworkDate(homework.dueAt))).toBeInTheDocument();
    expect(screen.getByText(formatHomeworkDate("2026-09-21T10:00:00Z"))).toBeInTheDocument();
    expect(screen.getByText(homework.description)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Домашние задания" })).toHaveAttribute("href", "/student/homework");
    expect(screen.getAllByText("Выполнено").length).toBeGreaterThan(1);
  });

  it("omits missing dates and description", () => {
    mocks.useQuery.mockReturnValue({ data: { ...homework, dueAt: null, completedAt: null, description: null } });
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.queryByText("Срок")).not.toBeInTheDocument();
    expect(screen.queryByText(homework.description)).not.toBeInTheDocument();
    expect(document.querySelectorAll("dl time")).toHaveLength(1);
  });

  it("preserves task numbering, types and selected CODE context", () => {
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    const list = screen.getByRole("list", { name: "Задания" });
    for (const number of ["1", "2", "3"]) expect(within(list).getByText(number)).toBeInTheDocument();
    for (const type of ["Текст", "Код", "FILE_UPLOAD"]) expect(within(list).getByText(type)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Открыть: Второе задание" });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(mocks.solution).toHaveBeenLastCalledWith(
      expect.objectContaining({ homeworkId: homework.id, homeworkStatus: homework.status, item: homework.items[0] }),
    );
  });

  it("counts only passed required items, keeping pending and optional work separate", () => {
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("Выполнено 0 из 1 обязательных заданий")).toBeInTheDocument();
    expect(screen.getByText("Дополнительные задания: выполнено 1 из 2")).toBeInTheDocument();
  });

  it("uses backend passed projection even when a later attempt failed", () => {
    mocks.useQuery.mockReturnValue({
      data: { ...homework, items: [{ ...homework.items[1], passed: true, latestSubmissionStatus: "FAILED" }] },
    });
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Выполнено 1 из 1 обязательных заданий")).toBeInTheDocument();
    expect(screen.queryByText("Не принято")).not.toBeInTheDocument();
  });

  it.each([
    ["FAILED", "Не принято"],
    ["SYSTEM_ERROR", "Ошибка проверки"],
    ["SUBMITTED", "Отправлено"],
  ])("preserves %s presentation", (status, label) => {
    mocks.useQuery.mockReturnValue({
      data: { ...homework, items: [{ ...homework.items[1], latestSubmissionStatus: status }] },
    });
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("does not invent completion for optional-only or empty homework", () => {
    mocks.useQuery.mockReturnValue({ data: { ...homework, items: [homework.items[0]] } });
    const { rerender } = render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("В этой работе нет обязательных заданий")).toBeInTheDocument();
    mocks.useQuery.mockReturnValue({ data: { ...homework, items: [] } });
    rerender(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByText("В этой работе пока нет заданий.")).toBeInTheDocument();
  });

  it("shows the layout skeleton while loading", () => {
    mocks.useQuery.mockReturnValue({ isPending: true });
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Загружаем домашнее задание…")).toBeInTheDocument();
  });

  it("retries ordinary errors but does not retry a 404", () => {
    const refetch = vi.fn();
    mocks.useQuery.mockReturnValue({ isError: true, error: { status: 500 }, refetch });
    render(<StudentHomeworkDetailView homeworkId="homework-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
