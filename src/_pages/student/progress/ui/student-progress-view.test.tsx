import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentProgress } from "@/entities/progress";

import { StudentProgressView } from "./student-progress-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), programRefetch: vi.fn(), progressRefetch: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (options: unknown) => options }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const program = (id: string, title: string) => ({
  id,
  learningProgramId: `learning-${id}`,
  title,
  status: "ACTIVE" as const,
  reportIntervalMinutes: 60,
  startedAt: "2026-09-01T00:00:00Z",
  subject: { id: "subject-1", name: "Программирование" },
});

const progress: CurrentProgress = {
  studentProgramId: "program-1",
  totalLearningMinutes: 125,
  sessionsCount: 6,
  attendanceRate: 0.75,
  totalTopics: 3,
  homework: { assigned: 5, completed: 4 },
  practice: { assigned: 8, completed: 7 },
  topics: { completed: [{ id: "topic-1", title: "Переменные", status: "COMPLETED" }], inProgress: [] },
  assessment: { understandingAverage: 4.5, independenceAverage: 4, practiceAverage: 4.25, homeworkAverage: 5 },
};

function result(data: unknown, overrides: Record<string, unknown> = {}) {
  return { data, isPending: false, isError: false, error: null, refetch: vi.fn(), ...overrides };
}

function setQueries(
  programs: ReturnType<typeof program>[],
  progressByProgram: Record<string, CurrentProgress> = { "program-1": progress },
  progressOverrides: Record<string, unknown> = {},
) {
  mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
    if (options.queryKey[0] === "student-programs") return result(programs, { refetch: mocks.programRefetch });

    return result(progressByProgram[String(options.queryKey.at(-1))], {
      refetch: mocks.progressRefetch,
      ...progressOverrides,
    });
  });
}

describe("StudentProgressView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.programRefetch.mockReset();
    mocks.progressRefetch.mockReset();
  });

  it("shows an empty state when no programs are assigned", () => {
    setQueries([]);
    render(<StudentProgressView />);

    expect(screen.getByText("Программ пока нет")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти к программам" })).toHaveAttribute("href", "/student/programs");
  });

  it("shows personal metrics and learning links for the only program", () => {
    setQueries([program("program-1", "Python с нуля")]);
    render(<StudentProgressView />);

    expect(screen.getByLabelText("Программа обучения")).toBeDisabled();
    expect(screen.getByText("Выполненные домашние задания")).toBeInTheDocument();
    expect(screen.getByText("Выполненная практика")).toBeInTheDocument();
    expect(screen.getByText("Оценки преподавателя")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Продолжить обучение" })).toHaveAttribute(
      "href",
      "/student/programs/program-1",
    );
    expect(screen.getByRole("link", { name: "Открыть домашние задания" })).toHaveAttribute("href", "/student/homework");
  });

  it("explains how to start when the selected program has no learning data", () => {
    setQueries([program("program-1", "Python с нуля")], {
      "program-1": {
        studentProgramId: "program-1",
        totalLearningMinutes: 0,
        sessionsCount: 0,
        attendanceRate: 0,
        totalTopics: 0,
        homework: { assigned: 0, completed: 0 },
        practice: { assigned: 0, completed: 0 },
        topics: { completed: [], inProgress: [] },
        assessment: {},
      },
    });
    render(<StudentProgressView />);

    expect(screen.getByText("Учебных данных пока нет")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Продолжить обучение" })).toHaveAttribute(
      "href",
      "/student/programs/program-1",
    );
  });

  it("loads progress for a newly selected program", () => {
    setQueries([program("program-1", "Python с нуля"), program("program-2", "Алгоритмы")], {
      "program-1": progress,
      "program-2": { ...progress, studentProgramId: "program-2", totalLearningMinutes: 240 },
    });
    render(<StudentProgressView />);

    fireEvent.change(screen.getByLabelText("Программа обучения"), { target: { value: "program-2" } });
    expect(screen.getByText("4 ч")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Продолжить обучение" })).toHaveAttribute(
      "href",
      "/student/programs/program-2",
    );
  });

  it("shows and retries a progress loading error", () => {
    setQueries([program("program-1", "Python с нуля")], {}, { isError: true, data: undefined });
    render(<StudentProgressView />);

    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить ваш прогресс.");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.progressRefetch).toHaveBeenCalledOnce();
  });
});
