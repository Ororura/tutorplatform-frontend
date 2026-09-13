import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/features/create-student", () => ({
  CreateStudentDialog: () => <button type="button">Добавить ученика</button>,
}));

vi.mock("./student-list-state", () => ({ StudentListState: () => <div>Список</div> }));

import { TeacherStudentsContent } from "./teacher-students-content";

describe("TeacherStudentsContent", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.list.mockClear();
    mocks.searchParams = "page=2&size=20";
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
    expect(mocks.replace).toHaveBeenCalledWith(
      "/teacher/students?size=20&search=%D0%90%D0%BB%D0%B5%D0%BA%D1%81",
      { scroll: false },
    );
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
    expect(mocks.replace).toHaveBeenCalledWith(
      "/teacher/students?size=20&accountStatus=REGISTERED",
      { scroll: false },
    );
  });
});
