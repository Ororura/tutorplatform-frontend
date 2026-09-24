import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StudentPage } from "@/entities/student";
import type { TeacherDashboard } from "@/entities/dashboard";

import { TeacherHomePage } from "./teacher-home-page";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  refetchDashboard: vi.fn(),
  refetchStudents: vi.fn(),
  refetchUser: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQuery: mocks.useQuery,
  };
});

vi.mock("@/entities/user", () => ({
  useCurrentUserQuery: mocks.currentUser,
}));

vi.mock("@/features/student/create", () => ({
  CreateStudentDialog: () => <button type="button">Добавить ученика</button>,
}));

vi.mock("@/features/program/create", () => ({
  CreateLearningProgramDialog: () => <button type="button">Создать программу</button>,
}));

vi.mock("@/features/task/create", () => ({
  CreateTaskDialog: () => <button type="button">Создать задание</button>,
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

const studentPage: StudentPage = {
  items: [
    {
      id: "student-1",
      firstName: "Анна",
      lastName: "Смирнова",
      status: "ACTIVE",
      accountStatus: "REGISTERED",
      createdAt: "2026-09-18T10:00:00Z",
    },
  ],
  page: 0,
  size: 6,
  totalElements: 1,
  totalPages: 1,
};

const dashboard: TeacherDashboard = {
  activeStudentsCount: 1,
  needsReviewSubmissionsCount: 1,
  overdueHomeworksCount: 0,
  completedLearningPeriodsWithoutPublishedReportCount: 0,
  attentionItems: [
    {
      type: "SUBMISSION_NEEDS_REVIEW",
      studentId: "student-1",
      displayName: "Анна Смирнова",
      resourceId: "submission-1",
      eventAt: "2026-09-21T12:30:00Z",
      navigation: {
        studentProgramId: "student-program-1",
        homeworkId: "homework-1",
        submissionId: "submission-1",
      },
    },
  ],
};

describe("TeacherHomePage", () => {
  beforeEach(() => {
    mocks.refetchDashboard.mockReset();
    mocks.refetchStudents.mockReset();
    mocks.refetchUser.mockReset();

    mocks.currentUser.mockReturnValue({
      data: {
        id: "teacher-1",
        email: "elena@example.com",
        displayName: "Елена",
        roles: ["TEACHER"],
      },
      isPending: false,
      isError: false,
      refetch: mocks.refetchUser,
    });

    mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
      if (options.queryKey[0] === "dashboard") {
        return {
          data: dashboard,
          isPending: false,
          isError: false,
          refetch: mocks.refetchDashboard,
        };
      }

      return {
        data: studentPage,
        isPending: false,
        isError: false,
        refetch: mocks.refetchStudents,
      };
    });
  });

  it("greets the authenticated teacher and requests a bounded student overview", () => {
    render(<TeacherHomePage />);

    expect(screen.getByRole("heading", { name: "Добрый день, Елена!" })).toBeInTheDocument();
    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["dashboard", "teacher"],
      }),
    );
    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["students", "list", { page: 0, size: 6, sort: "createdAt,desc" }],
      }),
    );
    expect(screen.getByRole("heading", { name: "Требует внимания" })).toBeInTheDocument();
    expect(screen.getByText("Работа ожидает проверки")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1\s*Активные ученики/ })).toHaveAttribute("href", "/teacher/students");
    expect(screen.getByRole("heading", { name: "Мои ученики" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Быстрые действия" })).toBeInTheDocument();
    expect(screen.getByText("Анна Смирнова")).toBeInTheDocument();
  });

  it("shows a page loading state without a fabricated name", () => {
    mocks.currentUser.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: mocks.refetchUser,
    });

    render(<TeacherHomePage />);

    expect(screen.getByText("Загружаем рабочее пространство…")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/Добрый день/)).not.toBeInTheDocument();
  });

  it("allows retry after a current-user error", () => {
    mocks.currentUser.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: mocks.refetchUser,
    });

    render(<TeacherHomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(mocks.refetchUser).toHaveBeenCalledOnce();
  });

  it("does not invent a greeting when guard data is unexpectedly null", () => {
    mocks.currentUser.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      refetch: mocks.refetchUser,
    });

    render(<TeacherHomePage />);

    expect(screen.queryByText(/Добрый день/)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить профиль преподавателя");
  });

  it("keeps the rest of the workspace usable when students fail to load", () => {
    mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
      if (options.queryKey[0] === "dashboard") {
        return {
          data: dashboard,
          isPending: false,
          isError: false,
          refetch: mocks.refetchDashboard,
        };
      }

      return {
        data: undefined,
        isPending: false,
        isError: true,
        refetch: mocks.refetchStudents,
      };
    });

    render(<TeacherHomePage />);

    expect(screen.getByRole("heading", { name: "Добрый день, Елена!" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Требует внимания" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Быстрые действия" })).toBeInTheDocument();
    expect(screen.getByText("Не удалось загрузить учеников.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetchStudents).toHaveBeenCalledOnce();
  });

  it("shows dashboard loading without hiding students", () => {
    mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
      if (options.queryKey[0] === "dashboard") {
        return {
          data: undefined,
          isPending: true,
          isError: false,
          refetch: mocks.refetchDashboard,
        };
      }

      return {
        data: studentPage,
        isPending: false,
        isError: false,
        refetch: mocks.refetchStudents,
      };
    });

    render(<TeacherHomePage />);

    expect(screen.getByText("Загружаем сводку…")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Анна Смирнова")).toBeInTheDocument();
  });

  it("allows retry after a dashboard error", () => {
    mocks.useQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
      if (options.queryKey[0] === "dashboard") {
        return {
          data: undefined,
          isPending: false,
          isError: true,
          refetch: mocks.refetchDashboard,
        };
      }

      return {
        data: studentPage,
        isPending: false,
        isError: false,
        refetch: mocks.refetchStudents,
      };
    });

    render(<TeacherHomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку сводки" }));

    expect(mocks.refetchDashboard).toHaveBeenCalledOnce();
    expect(screen.getByText("Анна Смирнова")).toBeInTheDocument();
  });
});
