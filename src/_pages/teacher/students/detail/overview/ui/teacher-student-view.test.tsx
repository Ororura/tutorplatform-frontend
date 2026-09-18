import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeacherStudentView } from "./teacher-student-view";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  revoke: {
    isPending: false,
    isError: false,
    mutate: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
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

vi.mock("@/entities/student", () => ({
  studentQueries: {
    detail: (id: string) => ({
      queryKey: ["students", "detail", id],
    }),
  },

  StudentDetailsCard: () => <div>Данные ученика</div>,

  StudentProfileNav: () => <nav>Обзор Программа</nav>,

  getStudentStatusLabel: (status: "ACTIVE" | "INACTIVE") => (status === "ACTIVE" ? "Активен" : "Неактивен"),

  getStudentAccountStatusLabel: (status: "REGISTERED" | "INVITED" | "UNREGISTERED") => {
    switch (status) {
      case "REGISTERED":
        return "Зарегистрирован";
      case "INVITED":
        return "Приглашён";
      case "UNREGISTERED":
        return "Без аккаунта";
    }
  },
}));

vi.mock("@/entities/student-invite", () => ({
  studentInviteQueries: {
    list: (id: string) => ({
      queryKey: ["student-invites", "list", id],
    }),
  },

  StudentInviteHistory: () => <div>Приглашения</div>,
}));

vi.mock("@/features/student/invite/create", () => ({
  CreateStudentInviteDialog: ({ available }: { available: boolean }) =>
    available ? <button type="button">Отправить приглашение</button> : null,
}));

vi.mock("@/features/student/edit", () => ({
  EditStudentForm: () => <form>Редактирование</form>,
}));

vi.mock("@/features/student/invite/revoke", () => ({
  useRevokeStudentInviteMutation: () => mocks.revoke,
}));

const baseStudent = {
  id: "student-1",
  firstName: "Алексей",
  lastName: "Иванов",
  status: "ACTIVE" as const,
  relation: {
    type: "PRIMARY" as const,
    startedAt: "2026-09-01T00:00:00Z",
  },
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

function setQueries(accountStatus: "REGISTERED" | "INVITED" | "UNREGISTERED", inviteStatus?: "ACTIVE" | "REVOKED") {
  mocks.useQuery.mockImplementation((options: { queryKey?: unknown[] }) => {
    if (options.queryKey?.includes("student-invites")) {
      return {
        isPending: false,
        isError: false,
        isSuccess: true,
        data: {
          items: inviteStatus
            ? [
                {
                  id: "invite-1",
                  email: "alex@example.com",
                  status: inviteStatus,
                  createdAt: "2026-09-01T00:00:00Z",
                  expiresAt: "2026-09-08T00:00:00Z",
                },
              ]
            : [],
        },
        error: null,
        refetch: vi.fn(),
      };
    }

    return {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        ...baseStudent,
        account: {
          status: accountStatus,
          email: accountStatus === "UNREGISTERED" ? undefined : "alex@example.com",
        },
      },
      error: null,
      refetch: vi.fn(),
    };
  });
}

describe("TeacherStudentView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.revoke.mutate.mockReset();
  });

  it("does not offer an invite to a registered student", () => {
    setQueries("REGISTERED");

    render(<TeacherStudentView studentId="student-1" />);

    expect(
      screen.getByRole("heading", {
        name: "Алексей Иванов",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Отправить приглашение",
      }),
    ).not.toBeInTheDocument();
  });

  it("offers an invite to an unregistered student without an active invite", () => {
    setQueries("UNREGISTERED");

    render(<TeacherStudentView studentId="student-1" />);

    expect(
      screen.getByRole("button", {
        name: "Отправить приглашение",
      }),
    ).toBeInTheDocument();
  });

  it("prevents duplicate invitations while an active invite exists", () => {
    setQueries("INVITED", "ACTIVE");

    render(<TeacherStudentView studentId="student-1" />);

    expect(screen.getByText("У ученика уже есть активное приглашение.")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Отправить приглашение",
      }),
    ).not.toBeInTheDocument();
  });
});
