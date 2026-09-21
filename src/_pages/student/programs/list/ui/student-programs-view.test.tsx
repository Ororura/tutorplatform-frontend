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

  it("renders programs assigned to the current student without teacher links", () => {
    mocks.useQuery.mockReturnValue({
      data: [
        {
          id: "program-1",
          learningProgramId: "learning-1",
          title: "Python с нуля",
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
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
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
