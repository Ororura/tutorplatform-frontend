import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentHomeworksView } from "./student-homeworks-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/entities/homework/api/student-homework-queries", () => ({
  studentHomeworkQueries: { list: (params: unknown) => ({ queryKey: ["student-homework", "list", params] }) },
}));

const page = {
  items: [
    {
      id: "assigned",
      studentProgramId: "program-1",
      title: "Новая работа",
      status: "ASSIGNED" as const,
      assignedAt: "2026-09-01T10:00:00Z",
      dueAt: "2026-09-20T10:00:00Z",
      overdue: false,
      itemsCount: 1,
      createdAt: "2026-09-01T10:00:00Z",
    },
    {
      id: "overdue",
      studentProgramId: "program-1",
      title: "Просроченная работа",
      status: "ASSIGNED" as const,
      assignedAt: "2026-08-01T10:00:00Z",
      overdue: true,
      itemsCount: 1,
      createdAt: "2026-08-01T10:00:00Z",
    },
    {
      id: "completed",
      studentProgramId: "program-1",
      title: "Готовая работа",
      status: "COMPLETED" as const,
      assignedAt: "2026-07-01T10:00:00Z",
      completedAt: "2026-07-02T10:00:00Z",
      overdue: false,
      itemsCount: 1,
      createdAt: "2026-07-01T10:00:00Z",
    },
    {
      id: "cancelled",
      studentProgramId: "program-1",
      title: "Отменённая работа",
      status: "CANCELLED" as const,
      assignedAt: "2026-07-01T10:00:00Z",
      overdue: false,
      itemsCount: 1,
      createdAt: "2026-07-01T10:00:00Z",
    },
  ],
  page: 0,
  size: 20,
  totalElements: 4,
  totalPages: 1,
};

describe("StudentHomeworksView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValue({ data: page, isPending: false, isError: false, refetch: vi.fn() });
  });

  it("renders owned homework states and links to detail", () => {
    render(<StudentHomeworksView />);

    expect(screen.getByText("Нужно выполнить")).toBeInTheDocument();
    expect(screen.getByText("Просрочено")).toBeInTheDocument();
    expect(screen.getByText("Выполнено")).toBeInTheDocument();
    expect(screen.getByText("Отменено")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Новая работа/ })).toHaveAttribute("href", "/student/homework/assigned");
    expect(screen.getByText(/Выполнено 2 июля 2026/)).toBeInTheDocument();
  });

  it("renders empty state without teacher actions", () => {
    mocks.useQuery.mockReturnValue({ data: { ...page, items: [] }, isPending: false, isError: false, refetch: vi.fn() });
    render(<StudentHomeworksView />);
    expect(screen.getByText("Домашних заданий пока нет")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /назначить/i })).not.toBeInTheDocument();
  });

  it("offers retry for a homework API error", () => {
    const refetch = vi.fn();
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch });
    render(<StudentHomeworksView />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
