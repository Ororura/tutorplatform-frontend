import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), replace: vi.fn(), refetch: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), usePathname: () => "/teacher/students/student-1/sessions", useSearchParams: () => new URLSearchParams("page=1") }));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));
import { TeacherStudentSessionsView } from "./teacher-student-sessions-view";

const emptyPage = { items: [], page: 1, size: 20, totalElements: 0, totalPages: 0 };
const result = (overrides: Record<string, unknown> = {}) => ({ isPending: false, isError: false, isFetching: false, data: emptyPage, error: null, refetch: mocks.refetch, ...overrides });
const programs = [{ id: "program-1", title: "Python", subject: { name: "Информатика" }, status: "ACTIVE" }];

describe("TeacherStudentSessionsView", () => {
  beforeEach(() => { mocks.useQuery.mockReset(); mocks.replace.mockReset(); mocks.refetch.mockReset(); });

  function setQueries(sessionResult: ReturnType<typeof result>, programData: unknown = programs) {
    mocks.useQuery.mockImplementation((options: { queryKey: unknown[] }) => options.queryKey.includes("lesson-sessions") ? sessionResult : result({ data: programData }));
  }

  it("shows initial loading without empty state", () => {
    setQueries(result({ isPending: true, data: undefined }));
    render(<TeacherStudentSessionsView studentId="student-1" />);
    expect(screen.getByText("Загружаем занятия…")).toBeInTheDocument();
    expect(screen.queryByText("Занятий пока нет")).not.toBeInTheDocument();
  });

  it("shows empty state and create action when a program exists", () => {
    setQueries(result());
    render(<TeacherStudentSessionsView studentId="student-1" />);
    expect(screen.getByText("Занятий пока нет")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Добавить занятие" })[0]).toHaveAttribute("href", "/teacher/students/student-1/sessions/new");
  });

  it("blocks create and links to Program when there are zero programs", () => {
    setQueries(result(), []);
    render(<TeacherStudentSessionsView studentId="student-1" />);
    expect(screen.queryByRole("link", { name: "Добавить занятие" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Перейти в раздел/ })).toHaveAttribute("href", "/teacher/students/student-1/program");
  });

  it("shows list error and retries", () => {
    setQueries(result({ isError: true, data: undefined, error: new Error("network") }));
    render(<TeacherStudentSessionsView studentId="student-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить занятия.");
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("uses server pagination and stores page in URL", () => {
    setQueries(result({ data: { ...emptyPage, page: 1, totalPages: 3, totalElements: 60 } }));
    render(<TeacherStudentSessionsView studentId="student-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Вперёд" }));
    expect(mocks.replace).toHaveBeenCalledWith("/teacher/students/student-1/sessions?page=2", { scroll: false });
    const sessionOptions = mocks.useQuery.mock.calls.find(([options]) => options.queryKey.includes("lesson-sessions"))?.[0];
    expect(sessionOptions.queryKey.at(-1)).toEqual({ page: 1, sort: "startedAt,desc" });
  });
});
