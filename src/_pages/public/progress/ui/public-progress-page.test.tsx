import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicCurrentProgress } from "@/entities/progress";
import { ApiClientError, type ApiErrorBody } from "@/shared/api/client";

import { PublicProgressPage } from "./public-progress-page";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), refetch: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  queryOptions: (options: unknown) => options,
}));

const progress: PublicCurrentProgress = {
  totalLearningMinutes: 125,
  sessionsCount: 6,
  attendanceRate: 0.75,
  homework: { assigned: 5, completed: 4 },
  practice: { assigned: 8, completed: 7 },
  topics: {
    completed: [{ title: "Переменные" }, { title: "Условия" }],
    inProgress: [{ title: "Циклы" }],
  },
  assessment: {
    understandingAverage: 4.5,
    independenceAverage: 4,
    practiceAverage: 4.25,
    homeworkAverage: 5,
  },
};

function result(overrides: Record<string, unknown> = {}) {
  return {
    data: progress,
    isPending: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}

function apiError(status: number) {
  const body: ApiErrorBody = {
    code: "PUBLIC_PROGRESS_UNAVAILABLE",
    message: "Unavailable",
    timestamp: "2026-09-22T10:00:00Z",
    traceId: "trace-1",
    details: [],
  };

  return new ApiClientError(status, body);
}

describe("PublicProgressPage", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.refetch.mockReset();
  });

  it("shows a loading state", () => {
    mocks.useQuery.mockReturnValue(result({ data: undefined, isPending: true }));
    render(<PublicProgressPage token="share-token" />);

    expect(screen.getByLabelText("Загружаем прогресс")).toHaveAttribute("aria-busy", "true");
  });

  it("renders all parent-safe progress sections without service fields", () => {
    mocks.useQuery.mockReturnValue(result());
    render(<PublicProgressPage token="share-token" />);

    expect(screen.getByText("2 ч 5 мин")).toBeInTheDocument();
    expect(screen.getByText(/75\s%/)).toBeInTheDocument();
    expect(screen.getByText("4 из 5")).toBeInTheDocument();
    expect(screen.getByText("7 из 8")).toBeInTheDocument();
    expect(screen.getByText("Переменные")).toBeInTheDocument();
    expect(screen.getByText("Циклы")).toBeInTheDocument();
    expect(screen.getByText("Оценки преподавателя")).toBeInTheDocument();
    expect(screen.queryByText("student-program-id")).not.toBeInTheDocument();
    expect(screen.queryByText("parent@example.test")).not.toBeInTheDocument();
    expect(screen.queryByText("private note")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each([
    [404, "Ссылка не найдена"],
    [410, "Ссылка больше не действует"],
  ])("shows a dedicated terminal state for %s", (status, title) => {
    mocks.useQuery.mockReturnValue(result({ data: undefined, isError: true, error: apiError(status) }));
    render(<PublicProgressPage token="unavailable-token" />);

    expect(screen.getByRole("alert")).toHaveTextContent(title);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows and retries a server error", () => {
    mocks.useQuery.mockReturnValue(result({ data: undefined, isError: true, error: apiError(500) }));
    render(<PublicProgressPage token="share-token" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить прогресс");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it("shows an empty state when learning has not started", () => {
    mocks.useQuery.mockReturnValue(
      result({
        data: {
          totalLearningMinutes: 0,
          sessionsCount: 0,
          attendanceRate: 0,
          homework: { assigned: 0, completed: 0 },
          practice: { assigned: 0, completed: 0 },
          topics: { completed: [], inProgress: [] },
          assessment: {},
        },
      }),
    );
    render(<PublicProgressPage token="share-token" />);

    expect(screen.getByText("Учебных данных пока нет")).toBeInTheDocument();
  });
});
