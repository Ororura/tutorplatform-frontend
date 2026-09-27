import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { TeacherStudentProgramDetailView } from "./teacher-student-program-detail-view";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  mutate: vi.fn(),
  resetMutation: vi.fn(),
}));

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/features/program/assign", () => ({
  AssignLearningProgramDialog: ({ triggerLabel }: { triggerLabel: string }) => <button>{triggerLabel}</button>,
}));

vi.mock("@/features/program/student-topic-access", () => ({
  useStudentTopicAccessMutation: () => ({
    mutate: mocks.mutate,
    reset: mocks.resetMutation,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const program = {
  id: "program-1",
  learningProgramId: "learning-1",
  title: "Python с нуля",
  description: "Описание",
  status: "ACTIVE" as const,
  reportIntervalMinutes: 60,
  startedAt: "2026-09-01T00:00:00Z",
  subject: {
    id: "subject-1",
    name: "Python",
    code: "PYTHON",
  },
  modules: [
    {
      id: "module-1",
      title: "Основы",
      position: 0,
      topics: [
        {
          id: "topic-locked",
          title: "Закрытая тема",
          position: 0,
          topicStatus: "ACTIVE" as const,
          progressStatus: "LOCKED" as const,
        },
        {
          id: "topic-available",
          title: "Доступная тема",
          position: 1,
          topicStatus: "ACTIVE" as const,
          progressStatus: "AVAILABLE" as const,
        },
        {
          id: "topic-progress",
          title: "Начатая тема",
          position: 2,
          topicStatus: "ACTIVE" as const,
          progressStatus: "IN_PROGRESS" as const,
        },
        {
          id: "topic-completed",
          title: "Завершённая тема",
          position: 3,
          topicStatus: "ACTIVE" as const,
          progressStatus: "COMPLETED" as const,
        },
      ],
    },
  ],
};

describe("TeacherStudentProgramDetailView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.mutate.mockReset();
    mocks.resetMutation.mockReset();
  });

  it("shows a safe 404 state", () => {
    const body = {
      code: "NOT_FOUND",
      message: "not found",
      timestamp: "2026-09-01T00:00:00Z",
      traceId: "trace",
      details: [],
    };

    mocks.useQuery.mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiClientError(404, body),
      data: undefined,
      refetch: vi.fn(),
    });

    render(<TeacherStudentProgramDetailView studentId="student-1" studentProgramId="program-missing" />);

    expect(
      screen.getByRole("heading", {
        name: "Программа не найдена",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Повторить",
      }),
    ).not.toBeInTheDocument();
  });

  it("links back to the student program overview", () => {
    mocks.useQuery.mockReturnValue({
      isPending: true,
      isError: false,
      error: null,
      data: undefined,
      refetch: vi.fn(),
    });

    render(<TeacherStudentProgramDetailView studentId="student-1" studentProgramId="program-1" />);

    expect(
      screen.getByRole("link", {
        name: "← Программы ученика",
      }),
    ).toHaveAttribute("href", "/teacher/students/student-1/program");
  });

  it("opens selected locked topics and protects started topics", () => {
    mocks.useQuery.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: program,
      refetch: vi.fn(),
    });

    render(<TeacherStudentProgramDetailView studentId="student-1" studentProgramId="program-1" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Управлять доступом к темам",
      }),
    );

    const locked = screen.getByRole("checkbox", {
      name: "Выбрать тему «Закрытая тема»",
    });

    const started = screen.getByRole("checkbox", {
      name: "Выбрать тему «Начатая тема»",
    });

    const completed = screen.getByRole("checkbox", {
      name: "Выбрать тему «Завершённая тема»",
    });

    expect(locked).toBeEnabled();
    expect(started).toBeDisabled();
    expect(completed).toBeDisabled();

    fireEvent.click(locked);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Открыть выбранные",
      }),
    );

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        status: "AVAILABLE",
        topicIds: ["topic-locked"],
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });

  it("locks an available topic", () => {
    mocks.useQuery.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: program,
      refetch: vi.fn(),
    });

    render(<TeacherStudentProgramDetailView studentId="student-1" studentProgramId="program-1" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Управлять доступом к темам",
      }),
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Выбрать тему «Доступная тема»",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Заблокировать выбранные",
      }),
    );

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        status: "LOCKED",
        topicIds: ["topic-available"],
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });
});
