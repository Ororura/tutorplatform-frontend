import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/shared/api/client";
import { TeacherStudentSessionDetailView } from "./teacher-student-session-detail-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
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

describe("TeacherStudentSessionDetailView", () => {
  beforeEach(() => mocks.useQuery.mockReset());
  it("renders content, topic, primary marker, summary and teacher-only notes", () => {
    mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) =>
      options?.queryKey?.includes("lesson-sessions")
        ? {
            data: session,
            isPending: false,
            isError: false,
          }
        : { data: program, isPending: false, isError: false },
    );
    render(<TeacherStudentSessionDetailView studentId="student-1" sessionId="session-1" />);
    expect(screen.getByText("Проведено")).toBeInTheDocument();
    expect(screen.getByText("Переменные")).toBeInTheDocument();
    expect(screen.getByText("Основная тема")).toBeInTheDocument();
    expect(screen.getByText("Разобрали переменные")).toBeInTheDocument();
    expect(screen.getByText("Повторить циклы")).toBeInTheDocument();
    expect(screen.getByText("Видны только преподавателю")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Редактировать" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/sessions/session-1/edit",
    );
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
        : { data: undefined, isPending: false, isError: false },
    );
    render(<TeacherStudentSessionDetailView studentId="student-1" sessionId="foreign" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Занятие не найдено");
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
  });
});
