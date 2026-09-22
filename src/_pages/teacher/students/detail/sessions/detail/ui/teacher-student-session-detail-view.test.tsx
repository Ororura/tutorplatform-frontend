import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/shared/api/client";
import { TeacherStudentSessionDetailView } from "./teacher-student-session-detail-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("@/features/assessment/save", () => ({
  AssessmentForm: () => <div>Форма оценки</div>,
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

const session = {
  id: "session-1",
  studentProgramId: "program-1",
  startedAt: "2026-09-14T13:30:00Z",
  durationMinutes: 60,
  attendanceStatus: "ATTENDED",
  summary: "Разобрали переменные",
  privateNotes: "Повторить циклы",
  topics: [{ topicId: "topic-1", isPrimary: true }],
  createdAt: "2026-09-14T13:30:00Z",
  updatedAt: "2026-09-14T13:30:00Z",
  version: 1,
};
const program = {
  id: "program-1",
  title: "Python",
  subject: { name: "Информатика" },
  modules: [{ id: "module-1", title: "Основы", topics: [{ id: "topic-1", title: "Переменные" }] }],
};
const assessment = {
  id: "assessment-1",
  lessonSessionId: "session-1",
  understandingScore: 4,
  independenceScore: 3,
  practiceScore: 5,
  homeworkScore: null,
  publicComment: "Хороший прогресс",
  createdAt: "2026-09-14T14:30:00Z",
  updatedAt: "2026-09-14T14:30:00Z",
};

const queryResult = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
});

describe("TeacherStudentSessionDetailView", () => {
  beforeEach(() => mocks.useQuery.mockReset());
  it("renders content, topic, primary marker, summary and teacher-only notes", () => {
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => {
      if (options?.queryKey?.includes("lesson-sessions")) return queryResult(session);
      if (options?.queryKey?.includes("assessments")) return queryResult(assessment);
      return queryResult(program);
    });
    render(<TeacherStudentSessionDetailView studentId="student-1" sessionId="session-1" />);
    expect(screen.getByText("Проведено")).toBeInTheDocument();
    expect(screen.getByText("Переменные")).toBeInTheDocument();
    expect(screen.getByText("Основная тема")).toBeInTheDocument();
    expect(screen.getByText("Разобрали переменные")).toBeInTheDocument();
    expect(screen.getByText("Повторить циклы")).toBeInTheDocument();
    expect(screen.getByText("Видны только преподавателю")).toBeInTheDocument();
    expect(screen.getByText("4 из 5")).toBeInTheDocument();
    expect(screen.getByText("Хороший прогресс")).toBeInTheDocument();
    expect(screen.getByText("Не указано")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Редактировать" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/sessions/session-1/edit",
    );
  });

  it("offers to assess a session when the assessment endpoint returns 404", () => {
    const missing = new ApiClientError(404, {
      code: "ASSESSMENT_NOT_FOUND",
      message: "internal",
      timestamp: "2026-01-01T00:00:00Z",
      traceId: "x",
      details: [],
    });
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => {
      if (options?.queryKey?.includes("lesson-sessions")) return queryResult(session);
      if (options?.queryKey?.includes("assessments"))
        return { ...queryResult(undefined), isError: true, error: missing };
      return queryResult(program);
    });
    render(<TeacherStudentSessionDetailView studentId="student-1" sessionId="session-1" />);
    expect(screen.getByText("Оцените проведённое занятие и оставьте комментарий для ученика.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Оценить занятие" }));
    expect(screen.getByText("Форма оценки")).toBeInTheDocument();
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
  });

  it("renders assessment loading and recoverable error states", () => {
    const assessmentRefetch = vi.fn();
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => {
      if (options?.queryKey?.includes("lesson-sessions")) return queryResult(session);
      if (options?.queryKey?.includes("assessments"))
        return { ...queryResult(undefined), isPending: true, refetch: assessmentRefetch };
      return queryResult(program);
    });
    const view = render(<TeacherStudentSessionDetailView studentId="student-1" sessionId="session-1" />);
    expect(screen.getByText("Загружаем оценку…")).toHaveAttribute("aria-busy", "true");

    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => {
      if (options?.queryKey?.includes("lesson-sessions")) return queryResult(session);
      if (options?.queryKey?.includes("assessments"))
        return {
          ...queryResult(undefined),
          isError: true,
          error: new Error("network"),
          refetch: assessmentRefetch,
        };
      return queryResult(program);
    });
    view.rerender(<TeacherStudentSessionDetailView studentId="student-1" sessionId="session-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить оценку занятия.");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(assessmentRefetch).toHaveBeenCalledOnce();
  });

  it("shows safe not found", () => {
    const error = new ApiClientError(404, {
      code: "LESSON_SESSION_NOT_FOUND",
      message: "internal",
      timestamp: "2026-01-01T00:00:00Z",
      traceId: "x",
      details: [],
    });
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) =>
      options?.queryKey?.includes("lesson-sessions")
        ? {
            data: undefined,
            isPending: false,
            isError: true,
            error,
          }
        : queryResult(undefined),
    );
    render(<TeacherStudentSessionDetailView studentId="student-1" sessionId="foreign" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Занятие не найдено");
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
  });
});
