import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { TeacherStudentReportsView } from "./teacher-student-reports-view";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  refetch: vi.fn(),
  create: vi.fn(),
  push: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("@/features/report/manage", () => ({
  useCreateProgressReportMutation: () => ({ mutateAsync: mocks.create, isPending: false }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

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
    mocks.create.mockReset();
    mocks.push.mockReset();
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

  it("creates a draft from a completed period and opens it", async () => {
    mocks.create.mockResolvedValue({ id: "report-new" });
    setQueries(
      undefined,
      result({
        data: [{ id: "period-1", sequenceNo: 1, status: "COMPLETED", completedAt: "2026-09-10T10:00:00Z" }],
      }),
    );

    render(<TeacherStudentReportsView studentId="student-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Создать черновик для периода 1" }));

    expect(mocks.create).toHaveBeenCalledWith({
      studentProgramId: "program-1",
      learningPeriodId: "period-1",
    });
    await vi.waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/teacher/students/student-1/reports/report-new"));
  });

  it("refreshes report data when the period already has a report", async () => {
    mocks.create.mockRejectedValue(
      new ApiClientError(409, {
        code: "PROGRESS_REPORT_ALREADY_EXISTS",
        message: "internal",
        timestamp: "2026-09-30T10:00:00Z",
        traceId: "trace",
        details: [],
      }),
    );
    setQueries(
      undefined,
      result({
        data: [{ id: "period-1", sequenceNo: 1, status: "COMPLETED", completedAt: "2026-09-10T10:00:00Z" }],
      }),
    );

    render(<TeacherStudentReportsView studentId="student-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Создать черновик для периода 1" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Отчёт для этого периода уже существует");
    expect(mocks.refetch).toHaveBeenCalledTimes(2);
  });
});
