import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), revoke: { isPending: false, isError: false, mutate: vi.fn() } }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/entities/student", () => ({
  studentQueries: { detail: (id: string) => ({ queryKey: ["students", "detail", id] }) },
  StudentDetailsCard: () => <div>Данные ученика</div>,
  StudentProfileNav: () => <nav>Обзор Программа</nav>,
}));
vi.mock("@/entities/student-invite", () => ({
  studentInviteQueries: { list: (id: string) => ({ queryKey: ["student-invites", "list", id] }) },
  StudentInviteHistory: () => <div>Приглашения</div>,
}));
vi.mock("@/features/create-student-invite", () => ({
  CreateStudentInviteDialog: ({ available }: { available: boolean }) => available ? <button>Отправить приглашение</button> : null,
}));
vi.mock("@/features/edit-student", () => ({ EditStudentForm: () => <form>Редактирование</form> }));
vi.mock("@/features/revoke-student-invite", () => ({ useRevokeStudentInviteMutation: () => mocks.revoke }));

import { TeacherStudentView } from "./teacher-student-view";

const baseStudent = {
  id: "student-1",
  firstName: "Алексей",
  lastName: "Иванов",
  status: "ACTIVE",
  relation: { type: "PRIMARY", startedAt: "2026-09-01T00:00:00Z" },
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
};

function setQueries(accountStatus: "REGISTERED" | "INVITED" | "UNREGISTERED", inviteStatus?: "ACTIVE" | "REVOKED") {
  mocks.useQuery
    .mockReturnValueOnce({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { ...baseStudent, account: { status: accountStatus, email: accountStatus === "UNREGISTERED" ? undefined : "alex@example.com" } },
      refetch: vi.fn(),
    })
    .mockReturnValueOnce({
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { items: inviteStatus ? [{ id: "invite-1", status: inviteStatus }] : [] },
      refetch: vi.fn(),
    });
}

describe("TeacherStudentView", () => {
  beforeEach(() => mocks.useQuery.mockReset());

  it("does not offer an invite to a registered student", () => {
    setQueries("REGISTERED");
    render(<TeacherStudentView studentId="student-1" />);
    expect(screen.getByRole("heading", { name: "Алексей Иванов" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отправить приглашение" })).not.toBeInTheDocument();
  });

  it("offers an invite to an unregistered student without an active invite", () => {
    setQueries("UNREGISTERED");
    render(<TeacherStudentView studentId="student-1" />);
    expect(screen.getByRole("button", { name: "Отправить приглашение" })).toBeInTheDocument();
  });

  it("prevents duplicate invitations while an active invite exists", () => {
    setQueries("INVITED", "ACTIVE");
    render(<TeacherStudentView studentId="student-1" />);
    expect(screen.getByText("У ученика уже есть активное приглашение.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отправить приглашение" })).not.toBeInTheDocument();
  });
});
