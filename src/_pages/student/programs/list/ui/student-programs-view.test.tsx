import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentProgramsView } from "./student-programs-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  queryOptions: (value: unknown) => value,
}));

describe("StudentProgramsView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
  });

  it("renders assigned program cards with student links and without edit actions", () => {
    mocks.useQuery.mockReturnValue({
      data: [
        {
          id: "program-1",
          learningProgramId: "learning-1",
          title: "Python с нуля",
          description: "Практическая программа для начинающих",
          status: "ACTIVE",
          startedAt: "2026-09-01T00:00:00Z",
          subject: { id: "subject-1", name: "Программирование", code: "PROGRAMMING" },
        },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<StudentProgramsView />);

    expect(screen.getByText("Python с нуля")).toBeInTheDocument();
    expect(screen.getByText("Программирование")).toBeInTheDocument();
    expect(screen.getByText("Практическая программа для начинающих")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть программу" })).toHaveAttribute(
      "href",
      "/student/programs/program-1",
    );
    expect(screen.queryByRole("button", { name: /редактировать/i })).not.toBeInTheDocument();
  });

  it("renders a loading state", () => {
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: vi.fn() });

    render(<StudentProgramsView />);

    expect(screen.getByText("Загружаем программы…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders the real empty state", () => {
    mocks.useQuery.mockReturnValue({ data: [], isPending: false, isError: false, refetch: vi.fn() });

    render(<StudentProgramsView />);

    expect(screen.getByText("Программ пока нет")).toBeInTheDocument();
  });

  it("offers retry after an API failure", () => {
    const refetch = vi.fn();
    mocks.useQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch });

    render(<StudentProgramsView />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

    expect(refetch).toHaveBeenCalledOnce();
  });
});
