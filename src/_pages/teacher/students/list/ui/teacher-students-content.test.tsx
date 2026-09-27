import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherStudentsContent } from "./teacher-students-content";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  list: vi.fn((params: unknown) => ({ queryKey: ["students", "list", params] })),
  searchParams: "page=2&size=20",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/teacher/students",
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(mocks.searchParams),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    isPending: false,
    isFetching: false,
    isError: false,
    data: { items: [{ id: "1" }], page: 2, size: 20, totalElements: 80, totalPages: 4 },
    refetch: vi.fn(),
  }),
}));

vi.mock("@/entities/student", () => ({
  studentQueries: { list: mocks.list },
}));

vi.mock("@/features/student/create", () => ({
  CreateStudentDialog: () => <button type="button">Добавить ученика</button>,
}));

vi.mock("./student-list-state", () => ({ StudentListState: () => <div>Список</div> }));

describe("TeacherStudentsContent", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.list.mockClear();
    mocks.searchParams = "page=2&size=20";
  });

  it("keeps the create action and count beside the list without a sidebar", () => {
    render(<TeacherStudentsContent />);
    expect(screen.getByRole("button", { name: "Добавить ученика" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Список учеников · 80" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByText("Быстрый переход")).not.toBeInTheDocument();
  });

  it.each([
    ["Сортировка", "lastName,asc", "size=20&sort=lastName%2Casc"],
    ["На странице", "50", "size=50"],
  ])("resets page for %s while preserving other URL parameters", (label, value, expected) => {
    mocks.searchParams = "page=2&size=20&search=Anna&accountStatus=INVITED";
    render(<TeacherStudentsContent />);
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    const url = new URL(mocks.replace.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.get("search")).toBe("Anna");
    expect(url.searchParams.get("accountStatus")).toBe("INVITED");
    for (const [key, item] of new URLSearchParams(expected)) expect(url.searchParams.get(key)).toBe(item);
  });

  it("submits search immediately and preserves sort and account status", () => {
    mocks.searchParams = "page=2&sort=firstName%2Casc&accountStatus=REGISTERED";
    render(<TeacherStudentsContent />);
    fireEvent.change(screen.getByLabelText("Поиск ученика"), { target: { value: "  Анна  " } });
    fireEvent.click(screen.getByRole("button", { name: "Найти" }));
    expect(mocks.replace).toHaveBeenCalledWith(
      "/teacher/students?sort=firstName%2Casc&accountStatus=REGISTERED&search=%D0%90%D0%BD%D0%BD%D0%B0",
      { scroll: false },
    );
  });

  it("passes URL pagination and the allow-listed defaults to the backend query", () => {
    render(<TeacherStudentsContent />);
    expect(mocks.list).toHaveBeenCalledWith({ page: 2, size: 20, sort: "createdAt,desc" });
  });

  it("maps the public search URL parameter to the backend query contract", () => {
    mocks.searchParams = "page=0&search=%D0%90%D0%BB%D0%B5%D0%BA%D1%81";
    render(<TeacherStudentsContent />);
    expect(mocks.list).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: "createdAt,desc",
      query: "Алекс",
    });
  });

  it("debounces search, sends it as backend query, and resets page", () => {
    vi.useFakeTimers();
    render(<TeacherStudentsContent />);
    fireEvent.change(screen.getByLabelText("Поиск ученика"), { target: { value: "Алекс" } });
    expect(mocks.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(400));
    expect(mocks.replace).toHaveBeenCalledWith("/teacher/students?size=20&search=%D0%90%D0%BB%D0%B5%D0%BA%D1%81", {
      scroll: false,
    });
    vi.useRealTimers();
  });

  it("changes the backend page through URL state", () => {
    render(<TeacherStudentsContent />);
    fireEvent.click(screen.getByRole("button", { name: "Вперёд" }));
    expect(mocks.replace).toHaveBeenCalledWith("/teacher/students?page=3&size=20", { scroll: false });
  });

  it("resets page when account filter changes", () => {
    render(<TeacherStudentsContent />);
    fireEvent.change(screen.getByLabelText("Статус аккаунта"), { target: { value: "REGISTERED" } });
    expect(mocks.replace).toHaveBeenCalledWith("/teacher/students?size=20&accountStatus=REGISTERED", { scroll: false });
  });
});
