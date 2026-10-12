import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherStudentActions } from "./teacher-student-actions";
const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), refetch: vi.fn() }));
vi.mock("@tanstack/react-query", async (original) => ({
  ...(await original<typeof import("@tanstack/react-query")>()),
  useQuery: mocks.useQuery,
}));
describe("TeacherStudentActions", () => {
  beforeEach(() => {
    mocks.refetch.mockReset();
    mocks.useQuery.mockReturnValue({ isSuccess: true, data: [{ id: "program-1" }] });
  });
  it("uses the existing student-scoped routes for all four actions", () => {
    render(<TeacherStudentActions studentId="owned-student" active />);
    for (const [label, path] of [
      ["Создать занятие", "sessions/new"],
      ["Назначить домашнее задание", "homework/new"],
      ["Открыть прогресс", "progress"],
      ["Открыть отчёты", "reports"],
    ]) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        `/teacher/students/owned-student/${path}`,
      );
    }
  });
  it("disables creation and explains missing prerequisites", () => {
    mocks.useQuery.mockReturnValue({ isSuccess: true, data: [] });
    const view = render(<TeacherStudentActions studentId="student-1" active />);
    expect(screen.getByRole("button", { name: "Создать занятие" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "назначьте программу обучения" })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/program",
    );
    view.rerender(<TeacherStudentActions studentId="student-1" active={false} />);
    expect(screen.getByText(/недоступно для неактивного ученика/)).toBeInTheDocument();
  });
  it("keeps creation disabled on loading/error and offers retry", () => {
    mocks.useQuery.mockReturnValue({ isPending: true });
    const view = render(<TeacherStudentActions studentId="student-1" active />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    mocks.useQuery.mockReturnValue({ isError: true, refetch: mocks.refetch });
    view.rerender(<TeacherStudentActions studentId="student-1" active />);
    expect(screen.getByRole("button", { name: "Назначить домашнее задание" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});
