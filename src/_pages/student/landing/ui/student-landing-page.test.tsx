import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentLandingPage } from "./student-landing-page";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useCurrentUserQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  queryOptions: (value: unknown) => value,
}));
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

const programs = ["Математика", "Физика", "Химия", "Биология"].map((title, index) => ({
  id: `program-${index}`,
  title,
  status: "ACTIVE" as const,
  subject: { id: `subject-${index}`, name: title },
  startedAt: "2026-09-01T10:00:00Z",
}));

const homeworkPage = {
  items: [
    {
      id: "homework-1",
      studentProgramId: "program-0",
      title: "Решить задачи",
      status: "ASSIGNED" as const,
      assignedAt: "2026-09-10T10:00:00Z",
      dueAt: "2026-09-25T10:00:00Z",
      overdue: false,
      itemsCount: 3,
      createdAt: "2026-09-10T10:00:00Z",
    },
  ],
  page: 0,
  size: 3,
  totalElements: 1,
  totalPages: 1,
};

function queryResult(data: unknown) {
  return { data, isPending: false, isError: false, refetch: vi.fn() };
}

describe("StudentLandingPage", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.useCurrentUserQuery.mockReset();
    mocks.useCurrentUserQuery.mockReturnValue(
      queryResult({ id: "student-1", displayName: "Мария", email: "maria@example.com", roles: ["STUDENT"] }),
    );
    mocks.useQuery.mockReturnValueOnce(queryResult(programs)).mockReturnValueOnce(queryResult(homeworkPage));
  });

  it("renders the student name, short API-backed lists and quick actions", () => {
    render(<StudentLandingPage />);

    expect(screen.getByRole("heading", { name: "Привет, Мария!" })).toBeInTheDocument();
    expect(screen.getAllByText("Математика")).not.toHaveLength(0);
    expect(screen.queryByText("Биология")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Решить задачи/ })).toHaveAttribute("href", "/student/homework/homework-1");
    expect(screen.getByRole("link", { name: "Все программы" })).toHaveAttribute("href", "/student/programs");
    expect(screen.getByRole("link", { name: "Все задания" })).toHaveAttribute("href", "/student/homework");
    expect(screen.getByRole("link", { name: "Открыть программы" })).toHaveAttribute("href", "/student/programs");
    expect(screen.getByRole("link", { name: "Перейти к домашним заданиям" })).toHaveAttribute(
      "href",
      "/student/homework",
    );

    expect(mocks.useQuery.mock.calls[1]?.[0]).toMatchObject({
      queryKey: ["student-homework", "list", { status: "ASSIGNED", page: 0, size: 3, sort: "assignedAt,desc" }],
    });
  });

  it("renders empty states for programs and unfinished homework", () => {
    mocks.useQuery.mockReset();
    mocks.useQuery
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult({ ...homeworkPage, items: [], totalElements: 0 }));

    render(<StudentLandingPage />);

    expect(screen.getByText("Программ пока нет")).toBeInTheDocument();
    expect(screen.getByText("Невыполненных заданий нет")).toBeInTheDocument();
  });

  it("renders loading states for all homepage data", () => {
    const loading = { data: undefined, isPending: true, isError: false, refetch: vi.fn() };
    mocks.useCurrentUserQuery.mockReturnValue(loading);
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValue(loading);

    render(<StudentLandingPage />);

    expect(screen.getByText("Загружаем профиль…")).toBeInTheDocument();
    expect(screen.getByText("Загружаем программы…")).toBeInTheDocument();
    expect(screen.getByText("Загружаем домашние задания…")).toBeInTheDocument();
  });

  it("renders retry actions for API errors", () => {
    const retryProfile = vi.fn();
    const retryPrograms = vi.fn();
    const retryHomeworks = vi.fn();
    mocks.useCurrentUserQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: retryProfile,
    });
    mocks.useQuery.mockReset();
    mocks.useQuery
      .mockReturnValueOnce({ data: undefined, isPending: false, isError: true, refetch: retryPrograms })
      .mockReturnValueOnce({ data: undefined, isPending: false, isError: true, refetch: retryHomeworks });

    render(<StudentLandingPage />);

    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(3);
    fireEvent.click(within(alerts[0]).getByRole("button", { name: "Повторить" }));
    fireEvent.click(within(alerts[1]).getByRole("button", { name: "Повторить" }));
    fireEvent.click(within(alerts[2]).getByRole("button", { name: "Повторить" }));
    expect(retryProfile).toHaveBeenCalledOnce();
    expect(retryPrograms).toHaveBeenCalledOnce();
    expect(retryHomeworks).toHaveBeenCalledOnce();
  });
});
