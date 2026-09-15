import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), replace: vi.fn(), params: "" }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), usePathname: () => "/teacher/students/alex/homework", useSearchParams: () => new URLSearchParams(mocks.params) }));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/entities/student", () => ({ StudentProfileNav: () => <nav>Домашние задания</nav> }));
import { TeacherStudentHomeworksView } from "./teacher-student-homeworks-view";

const emptyPage = { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
describe("TeacherStudentHomeworksView", () => {
  beforeEach(() => { mocks.replace.mockReset(); mocks.params = ""; mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => options?.queryKey?.includes("student-programs") ? { data: [], isPending: false, isError: false } : { data: emptyPage, isPending: false, isError: false, isFetching: false, refetch: vi.fn() }); });
  it("shows the empty state and blocks creation without programs", () => { render(<TeacherStudentHomeworksView studentId="alex" />); expect(screen.getByText("Домашних заданий пока нет")).toBeInTheDocument(); expect(screen.getByRole("link", { name: /Программа/ })).toHaveAttribute("href", "/teacher/students/alex/program"); expect(screen.queryByRole("link", { name: "Назначить домашнее задание" })).not.toBeInTheDocument(); });
  it("shows create action with a program and sends status through URL", () => { mocks.useQuery.mockImplementation((options?: { queryKey?: unknown[] }) => options?.queryKey?.includes("student-programs") ? { data: [{ id: "p1", title: "Python" }], isPending: false, isError: false } : { data: emptyPage, isPending: false, isError: false, isFetching: false, refetch: vi.fn() }); render(<TeacherStudentHomeworksView studentId="alex" />); expect(screen.getAllByRole("link", { name: "Назначить домашнее задание" }).length).toBeGreaterThan(0); fireEvent.change(screen.getByLabelText("Статус"), { target: { value: "COMPLETED" } }); expect(mocks.replace).toHaveBeenCalledWith("/teacher/students/alex/homework?status=COMPLETED", { scroll: false }); });
});
