import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeacherStudentReportsView } from "./teacher-student-reports-view";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), refetch: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const result = (overrides: Record<string, unknown> = {}) => ({
  isPending: false,
  isError: false,
  data: undefined,
  refetch: mocks.refetch,
  ...overrides,
});
const programs = [{ id: "program-1", title: "Python" }];

describe("TeacherStudentReportsView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.refetch.mockReset();
  });

  function setQueries(
    report = result({ data: { items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 } }),
    periods = result({ data: [] }),
    program = result({ data: programs }),
  ) {
    mocks.useQuery.mockImplementation((options: { queryKey: unknown[] }) => {
      if (options.queryKey.includes("learning-periods")) return periods;
      if (options.queryKey.includes("progress-reports")) return report;
      return program;
    });
  }

  it("shows loading and error states for reports", () => {
    setQueries(result({ isPending: true }));
    render(<TeacherStudentReportsView studentId="student-1" />);
    expect(screen.getByText("Загружаем отчёты…")).toBeInTheDocument();

    setQueries(result({ isError: true }));
    render(<TeacherStudentReportsView studentId="student-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить отчёты.");
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("shows empty reports and completed periods that still need a report", () => {
    setQueries(
      undefined,
      result({
        data: [
          { id: "period-1", sequenceNo: 1, status: "COMPLETED", completedAt: "2026-09-10T10:00:00Z", reportId: null },
          {
            id: "period-2",
            sequenceNo: 2,
            status: "COMPLETED",
            completedAt: "2026-09-20T10:00:00Z",
            reportId: "report-2",
          },
        ],
      }),
    );
    render(<TeacherStudentReportsView studentId="student-1" />);
    expect(screen.getByText("Отчётов пока нет")).toBeInTheDocument();
    expect(screen.getByText("Период 1")).toBeInTheDocument();
    expect(screen.queryByText("Период 2")).not.toBeInTheDocument();
  });
});
