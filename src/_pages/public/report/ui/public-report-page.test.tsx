import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicProgressReport } from "@/entities/report";
import { ApiClientError, type ApiErrorBody } from "@/shared/api/client";

import { PublicReportPage } from "./public-report-page";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), refetch: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery, queryOptions: (value: unknown) => value }));
vi.mock("@/features/report/download", () => ({
  ReportPdfDownloadButton: ({ token }: { token: string }) => <button type="button">Скачать PDF {token}</button>,
}));

const publicReport: PublicProgressReport = {
  periodStartedAt: "2026-09-01T10:00:00Z",
  periodEndedAt: "2026-09-30T10:00:00Z",
  learningMinutes: 90,
  snapshot: {
    metrics: {
      learningMinutes: 90,
      sessionsCount: 8,
      attendanceRate: 0.75,
      homeworkAssigned: 4,
      homeworkCompleted: 3,
      practiceAssigned: 5,
      practiceCompleted: 4,
    },
    topics: {
      completed: [{ id: "internal-topic-id", title: "Переменные" }],
      inProgress: [{ id: "another-internal-id", title: "Циклы" }],
    },
    assessment: { understandingAverage: 4.5 },
    skills: [{ skillId: "internal-skill-id", name: "Алгоритмы", progress: 80 }],
  },
  teacherSummary: "Хороший прогресс",
  nextPeriodPlan: "Изучить функции",
  publishedAt: "2026-10-01T10:00:00Z",
};

function result(overrides: Record<string, unknown> = {}) {
  return {
    data: publicReport,
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

function apiError(status: number) {
  const body: ApiErrorBody = {
    code: "REPORT_SHARE_UNAVAILABLE",
    message: "internal server detail",
    timestamp: "2026-09-24T10:00:00Z",
    traceId: "private-trace-id",
    details: [],
  };
  return new ApiClientError(status, body);
}

describe("PublicReportPage", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.refetch.mockReset();
  });

  it("shows a mobile-first loading state", () => {
    mocks.useQuery.mockReturnValue(result({ data: undefined, isPending: true }));
    render(<PublicReportPage token="share-token" />);
    expect(screen.getByLabelText("Загружаем отчёт")).toHaveAttribute("aria-busy", "true");
  });

  it("renders the historical parent-safe snapshot and PDF action", () => {
    mocks.useQuery.mockReturnValue(result());
    render(<PublicReportPage token="share-token" />);
    expect(screen.getByText("1 ч 30 мин")).toBeInTheDocument();
    expect(screen.getByText(/75\s*%/)).toBeInTheDocument();
    expect(screen.getByText("3 из 4")).toBeInTheDocument();
    expect(screen.getByText("Переменные")).toBeInTheDocument();
    expect(screen.getByText("Алгоритмы — 80%")).toBeInTheDocument();
    expect(screen.getByText("Хороший прогресс")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Скачать PDF share-token" })).toBeInTheDocument();
    expect(screen.queryByText("internal-topic-id")).not.toBeInTheDocument();
    expect(screen.queryByText("internal-skill-id")).not.toBeInTheDocument();
    expect(screen.queryByText("private-trace-id")).not.toBeInTheDocument();
  });

  it.each([
    [404, "Отчёт не найден"],
    [410, "Ссылка больше не действует"],
  ])("shows a terminal state for %s without retry", (status, title) => {
    mocks.useQuery.mockReturnValue(result({ data: undefined, isError: true, error: apiError(status) }));
    render(<PublicReportPage token="unavailable" />);
    expect(screen.getByRole("alert")).toHaveTextContent(title);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a retry for server errors without leaking service details", () => {
    mocks.useQuery.mockReturnValue(result({ data: undefined, isError: true, error: apiError(500) }));
    render(<PublicReportPage token="share-token" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить отчёт");
    expect(screen.queryByText("internal server detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});
