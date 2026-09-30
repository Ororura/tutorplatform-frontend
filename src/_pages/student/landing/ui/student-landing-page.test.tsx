import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StudentHomeworkDetails, StudentHomeworkPage } from "@/entities/homework";
import type { CurrentProgress } from "@/entities/progress";
import type { StudentProgramDetails, StudentProgramSummary } from "@/entities/student-program";

import { StudentLandingPage } from "./student-landing-page";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), useCurrentUserQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("@/entities/user", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/user")>()),
  useCurrentUserQuery: mocks.useCurrentUserQuery,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const programs: StudentProgramSummary[] = ["Python с нуля", "Практический проект", "Математика", "Физика"].map(
  (title, index) => ({
    id: `program-${index}`,
    learningProgramId: `learning-${index}`,
    title,
    status: "ACTIVE",
    reportIntervalMinutes: 60,
    subject: { id: `subject-${index}`, name: "Программирование" },
    startedAt: "2026-09-01T10:00:00Z",
  }),
);
const homeworkPage: StudentHomeworkPage = {
  items: [
    {
      id: "homework-1",
      studentProgramId: "program-0",
      title: "Циклы",
      status: "ASSIGNED",
      assignedAt: "2026-09-10T10:00:00Z",
      dueAt: "2026-09-24T15:00:00Z",
      overdue: true,
      itemsCount: 2,
      createdAt: "2026-09-10T10:00:00Z",
    },
  ],
  page: 0,
  size: 3,
  totalElements: 8,
  totalPages: 3,
};
const homeworkDetails: StudentHomeworkDetails = {
  ...homeworkPage.items[0],
  description: "Практика циклов for и while.",
  items: [true, false].map((passed, index) => ({
    id: `item-${index}`,
    taskId: `task-${index}`,
    position: index,
    required: true,
    passed,
    latestSubmissionStatus: passed ? "PASSED" : null,
    task: {
      id: `task-${index}`,
      title: "Задание",
      descriptionMarkdown: "Практика",
      taskType: "TEXT",
      difficulty: "EASY",
    },
  })),
};
const programDetails: StudentProgramDetails = {
  ...programs[0],
  modules: [
    {
      id: "module-1",
      title: "Управление программой",
      position: 0,
      topics: [
        { id: "intro", title: "Введение", position: 0, topicStatus: "ACTIVE", progressStatus: "COMPLETED" },
        { id: "for", title: "Цикл for", position: 1, topicStatus: "ACTIVE", progressStatus: "IN_PROGRESS" },
        { id: "while", title: "Цикл while", position: 2, topicStatus: "ACTIVE", progressStatus: "AVAILABLE" },
        { id: "locked", title: "Закрытая тема", position: 3, topicStatus: "ACTIVE", progressStatus: "LOCKED" },
      ],
    },
  ],
};
const progress: CurrentProgress = {
  studentProgramId: "program-0",
  totalTopics: 3,
  topics: {
    completed: [{ id: "intro", title: "Введение", status: "COMPLETED" }],
    inProgress: [{ id: "for", title: "Цикл for", status: "IN_PROGRESS" }],
  },
};

function queryResult(data: unknown) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}
const responses = new Map<string, ReturnType<typeof queryResult>>();
function setResponse(key: unknown[], result: ReturnType<typeof queryResult>) {
  responses.set(JSON.stringify(key), result);
}
function setHomework(data: StudentHomeworkPage) {
  setResponse(["student-homework", "list"], queryResult(data));
}
function setPrograms(data: StudentProgramSummary[]) {
  setResponse(["student-programs", "list"], queryResult(data));
}

describe("StudentLandingPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
    responses.clear();
    mocks.useQuery.mockReset();
    mocks.useCurrentUserQuery.mockReset();
    mocks.useCurrentUserQuery.mockReturnValue(queryResult({ displayName: "Мария Иванова" }));
    setPrograms(programs);
    setHomework(homeworkPage);
    setResponse(["student-homework", "detail", "homework-1"], queryResult(homeworkDetails));
    setResponse(["student-programs", "detail", "current-student", "program-0"], queryResult(programDetails));
    setResponse(["progress", "current-student", "program", "program-0"], queryResult(progress));
    mocks.useQuery.mockImplementation(
      ({ queryKey }: { queryKey: unknown[] }) =>
        responses.get(JSON.stringify(queryKey)) ??
        responses.get(JSON.stringify(queryKey.slice(0, 2))) ??
        queryResult(undefined),
    );
  });
  afterEach(() => vi.useRealTimers());

  it("greets by first name, uses the full active count and puts homework before programs", () => {
    render(<StudentLandingPage />);
    expect(screen.getByRole("heading", { name: "Добрый день, Мария!" })).toBeInTheDocument();
    expect(screen.getByText(/Задания, которые ждут тебя: 8/)).toBeInTheDocument();
    const homework = screen.getByRole("region", { name: "Домашние задания" });
    const program = screen.getByRole("region", { name: "Моя программа" });
    expect(homework.compareDocumentPosition(program) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "Все задания" })).toHaveAttribute("href", "/student/homework");
    expect(screen.getByRole("link", { name: "Все программы" })).toHaveAttribute("href", "/student/programs");
    expect(screen.queryByText("Быстрые действия")).not.toBeInTheDocument();
    expect(screen.queryByText("Открыть программы")).not.toBeInTheDocument();
    expect(screen.queryByText("Физика")).not.toBeInTheDocument();
    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["student-homework", "list", { status: "ASSIGNED", page: 0, size: 3, sort: "dueAt,asc" }],
      }),
    );
  });

  it("derives overdue presentation and renders homework progress from detail data", () => {
    setHomework({ ...homeworkPage, items: [{ ...homeworkPage.items[0], overdue: false }] });
    render(<StudentLandingPage />);
    const card = screen.getByRole("article", { name: "Циклы" });
    expect(within(card).getByText("Просрочено")).toBeInTheDocument();
    expect(within(card).getByText("Просрочено: 5 дн.")).toBeInTheDocument();
    expect(within(card).getByText("1 из 2 выполнено")).toBeInTheDocument();
    expect(within(card).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(within(card).getByRole("link", { name: "Продолжить выполнение" })).toHaveAttribute(
      "href",
      "/student/homework/homework-1",
    );
    expect(screen.getByText("Ближайший срок")).toBeInTheDocument();
  });

  it("shows real topic counts, navigable current topics and motivation", () => {
    render(<StudentLandingPage />);
    const card = screen.getByRole("article", { name: "Python с нуля" });
    expect(within(card).getByText("1 из 3 тем пройдено")).toBeInTheDocument();
    expect(within(card).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    expect(within(card).getByRole("link", { name: /Текущая тема/ })).toHaveAttribute(
      "href",
      "/student/programs/program-0/topics/for",
    );
    expect(screen.getByText(/Ты прошёл 33% программы/)).toBeInTheDocument();
    expect(screen.queryByText("Закрытая тема")).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Практический проект" }).querySelector("a")).toHaveAttribute(
      "href",
      "/student/programs/program-1",
    );
  });

  it("expands the active program associated with priority homework", () => {
    setPrograms([programs[1], programs[0]]);
    render(<StudentLandingPage />);
    const region = screen.getByRole("region", { name: "Моя программа" });
    expect(within(region).getAllByRole("article")[0]).toHaveAttribute("aria-label", "Python с нуля");
    expect(within(region).getByText("Текущая тема")).toBeInTheDocument();
  });

  it("omits unavailable optional fields and uses a universal homework action", () => {
    setHomework({ ...homeworkPage, items: [{ ...homeworkPage.items[0], dueAt: null }] });
    setPrograms([programs[0]]);
    setResponse(["student-homework", "detail", "homework-1"], queryResult(undefined));
    setResponse(["student-programs", "detail", "current-student", "program-0"], queryResult(undefined));
    setResponse(["progress", "current-student", "program", "program-0"], queryResult({ totalTopics: 3 }));
    render(<StudentLandingPage />);
    expect(screen.getByRole("link", { name: "Открыть задание" })).toHaveAttribute(
      "href",
      "/student/homework/homework-1",
    );
    expect(screen.queryByText("Ближайший срок")).not.toBeInTheDocument();
    expect(screen.queryByText("Просрочено")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("Отличный прогресс!")).not.toBeInTheDocument();
    expect(screen.queryByText("Текущая тема")).not.toBeInTheDocument();
  });

  it("offers the task action for an unstarted assignment and tolerates zero items", () => {
    setResponse(["student-homework", "detail", "homework-1"], queryResult({ ...homeworkDetails, items: [] }));
    render(<StudentLandingPage />);
    const card = screen.getByRole("article", { name: "Циклы" });
    expect(within(card).getByRole("link", { name: "Перейти к заданию" })).toBeInTheDocument();
    expect(within(card).queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("supports a single long title and does not render completed or cancelled homework", () => {
    const title = "Очень длинное название домашнего задания ".repeat(5);
    setPrograms([programs[0]]);
    setHomework({
      ...homeworkPage,
      items: [
        { ...homeworkPage.items[0], title },
        { ...homeworkPage.items[0], id: "completed", title: "Завершённое ДЗ", status: "COMPLETED" },
        { ...homeworkPage.items[0], id: "cancelled", title: "Отменённое ДЗ", status: "CANCELLED" },
      ],
    });
    render(<StudentLandingPage />);
    expect(screen.getByRole("heading", { name: title.trim() })).toBeInTheDocument();
    expect(screen.queryByText("Завершённое ДЗ")).not.toBeInTheDocument();
    expect(screen.queryByText("Отменённое ДЗ")).not.toBeInTheDocument();
  });

  it("renders independent empty states", () => {
    setPrograms([]);
    setHomework({ ...homeworkPage, items: [], totalElements: 0 });
    render(<StudentLandingPage />);
    expect(screen.getByText("Программ пока нет")).toBeInTheDocument();
    expect(screen.getByText("Невыполненных заданий нет")).toBeInTheDocument();
    expect(screen.queryByText("Ближайший срок")).not.toBeInTheDocument();
  });

  it("renders profile and layout-shaped list loading states", () => {
    const loading = { data: undefined, isPending: true, isError: false, refetch: vi.fn() };
    mocks.useCurrentUserQuery.mockReturnValue(loading);
    mocks.useQuery.mockReturnValue(loading);
    render(<StudentLandingPage />);
    expect(screen.getByText("Загружаем профиль…")).toBeInTheDocument();
    expect(screen.getByText("Загружаем программы…")).toBeInTheDocument();
    expect(screen.getByText("Загружаем домашние задания…")).toBeInTheDocument();
  });

  it("keeps retry actions separate for profile, homework and programs errors", () => {
    const profileRetry = vi.fn(),
      homeworkRetry = vi.fn(),
      programsRetry = vi.fn();
    mocks.useCurrentUserQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: profileRetry,
    });
    setResponse(["student-homework", "list"], {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: homeworkRetry,
    });
    setResponse(["student-programs", "list"], {
      data: undefined,
      isPending: false,
      isError: true,
      refetch: programsRetry,
    });
    render(<StudentLandingPage />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(3);
    alerts.forEach((alert) => fireEvent.click(within(alert).getByRole("button", { name: "Повторить" })));
    expect(profileRetry).toHaveBeenCalledOnce();
    expect(homeworkRetry).toHaveBeenCalledOnce();
    expect(programsRetry).toHaveBeenCalledOnce();
  });

  it("keeps summary cards usable when optional detail/progress queries fail", () => {
    const error = { data: undefined, isPending: false, isError: true, refetch: vi.fn() };
    setResponse(["student-homework", "detail", "homework-1"], error);
    setResponse(["student-programs", "detail", "current-student", "program-0"], error);
    setResponse(["progress", "current-student", "program", "program-0"], error);
    render(<StudentLandingPage />);
    expect(screen.getByRole("link", { name: "Открыть задание" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Python с нуля" })).toBeInTheDocument();
    expect(screen.queryByText("Отличный прогресс!")).not.toBeInTheDocument();
  });
});
