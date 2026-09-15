import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), replace: vi.fn(), params: "" }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), usePathname: () => "/teacher/tasks", useSearchParams: () => new URLSearchParams(mocks.params) }));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/features/task/create", () => ({ CreateTaskDialog: () => <button>Создать задание</button> }));
import { TeacherTasksView } from "./teacher-tasks-view";

const subjects = [{ id: "subject-1", name: "Python", status: "ACTIVE" }];
const page = { items: [{ id: "task-1", subjectId: "subject-1", title: "Задача", descriptionMarkdown: "D", taskType: "TEXT", difficulty: "EASY", status: "ACTIVE", version: 0, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" }], page: 0, size: 20, totalElements: 1, totalPages: 1 };

describe("TeacherTasksView", () => {
  beforeEach(() => { mocks.replace.mockReset(); mocks.params = ""; mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => options?.queryKey?.includes("subjects") ? { data: subjects, isPending: false, isError: false, refetch: vi.fn() } : { data: page, isPending: false, isError: false, isFetching: false, refetch: vi.fn() }); });
  it("renders backend task list and create action", () => { render(<TeacherTasksView />); expect(screen.getByText("Задача")).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Создать задание" })).toBeInTheDocument(); });
  it("writes supported filters to URL so the query receives them", () => { render(<TeacherTasksView />); fireEvent.change(screen.getByLabelText("Статус"), { target: { value: "ACTIVE" } }); expect(mocks.replace).toHaveBeenCalledWith("/teacher/tasks?status=ACTIVE", { scroll: false }); });
  it("shows loading and retryable errors", () => { const refetch = vi.fn(); mocks.useQuery.mockReturnValue({ isPending: true, isError: false, refetch }); const { rerender } = render(<TeacherTasksView />); expect(screen.getByText("Загружаем задания…")).toBeInTheDocument(); mocks.useQuery.mockReturnValue({ isPending: false, isError: true, refetch }); rerender(<TeacherTasksView />); fireEvent.click(screen.getByRole("button", { name: "Повторить" })); expect(refetch).toHaveBeenCalled(); });
});
