import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentProgress } from "@/entities/progress";

import { TeacherStudentProgressView } from "./teacher-student-progress-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), programRefetch: vi.fn(), progressRefetch: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  queryOptions: (options: unknown) => options,
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  }) => (
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

const fullProgress: CurrentProgress = {
  studentProgramId: "program-1",
  totalLearningMinutes: 125,
  sessionsCount: 6,
  attendanceRate: 0.75,
  totalTopics: 3,
  homework: { assigned: 5, completed: 4 },
  practice: { assigned: 8, completed: 7 },
  topics: {
    completed: [{ id: "topic-1", title: "Переменные", status: "COMPLETED" }],
    inProgress: [{ id: "topic-2", title: "Циклы", status: "IN_PROGRESS" }],
  },
  assessment: {
    understandingAverage: 4.5,
    independenceAverage: 4,
    practiceAverage: 4.25,
    homeworkAverage: 5,
  },
};

function result(data: unknown, overrides: Record<string, unknown> = {}) {
  return {
    data,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

function setQueries(
  programs: ReturnType<typeof program>[],
  progressByProgram: Record<string, CurrentProgress> = { "program-1": fullProgress },
  progressOverrides: Record<string, unknown> = {},
) {
  mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
    if (options.queryKey[0] === "student-programs") {
      return result(programs, { refetch: mocks.programRefetch });
    }

    const selectedProgramId = String(options.queryKey.at(-1));
    return result(progressByProgram[selectedProgramId], { refetch: mocks.progressRefetch, ...progressOverrides });
  });
}

describe("TeacherStudentProgressView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.programRefetch.mockReset();
    mocks.progressRefetch.mockReset();
  });

  it("shows an empty state when the student has no assigned programs", () => {
    setQueries([]);

    render(<TeacherStudentProgressView studentId="student-1" />);

    expect(screen.getByText("Нет программ для отображения прогресса")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти к программам" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/program",
    );
    expect(screen.queryByLabelText("Программа обучения")).not.toBeInTheDocument();
  });

  it("selects the only program and preserves zero values", () => {
    setQueries([program("program-1", "Python с нуля")], {
      "program-1": {
        totalLearningMinutes: 0,
        sessionsCount: 0,
        attendanceRate: 0,
        totalTopics: 0,
        homework: { assigned: 0, completed: 0 },
        practice: { assigned: 0, completed: 0 },
        topics: { completed: [], inProgress: [] },
        assessment: {
          understandingAverage: 0,
          independenceAverage: 0,
          practiceAverage: 0,
          homeworkAverage: 0,
        },
      },
    });

    render(<TeacherStudentProgressView studentId="student-1" />);

    const selector = screen.getByLabelText("Программа обучения");
    expect(selector).toBeDisabled();
    expect(selector).toHaveValue("program-1");
    expect(screen.getByText("0 мин")).toBeInTheDocument();
    expect(screen.getByText((value) => value.replaceAll(/\s/g, "") === "0%")).toBeInTheDocument();
    expect(screen.getAllByText("0 из 0")).toHaveLength(2);
  });

  it("offers all assigned programs", () => {
    setQueries([program("program-1", "Python с нуля"), program("program-2", "Алгоритмы")]);

    render(<TeacherStudentProgressView studentId="student-1" />);

    const selector = screen.getByLabelText("Программа обучения");
    expect(selector).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Python с нуля" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Алгоритмы" })).toBeInTheDocument();
  });

  it("loads progress for the newly selected program", () => {
    setQueries([program("program-1", "Python с нуля"), program("program-2", "Алгоритмы")], {
      "program-1": fullProgress,
      "program-2": { ...fullProgress, studentProgramId: "program-2", totalLearningMinutes: 240 },
    });

    render(<TeacherStudentProgressView studentId="student-1" />);
    fireEvent.change(screen.getByLabelText("Программа обучения"), { target: { value: "program-2" } });

    expect(screen.getByText("240 мин")).toBeInTheDocument();
    const progressCalls = mocks.useQuery.mock.calls.filter(([options]) => options.queryKey[0] === "progress");
    expect(progressCalls.at(-1)?.[0].queryKey).toContain("program-2");
  });

  it("shows missing metrics and empty topic lists without inventing values", () => {
    setQueries([program("program-1", "Python с нуля")], { "program-1": {} });

    render(<TeacherStudentProgressView studentId="student-1" />);

    expect(screen.getByText("Завершённых тем пока нет.")).toBeInTheDocument();
    expect(screen.getByText("Сейчас нет тем в процессе изучения.")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(10);
  });

  it("shows a progress API error and retries", () => {
    setQueries([program("program-1", "Python с нуля")], {}, { isError: true, data: undefined });

    render(<TeacherStudentProgressView studentId="student-1" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить прогресс ученика.");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.progressRefetch).toHaveBeenCalledOnce();
  });
});
