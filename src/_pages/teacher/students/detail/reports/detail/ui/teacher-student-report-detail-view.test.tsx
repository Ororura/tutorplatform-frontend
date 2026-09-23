import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProgressReportDetails } from "@/entities/report";
import { ApiClientError } from "@/shared/api/client";

import { TeacherStudentReportDetailView } from "./teacher-student-report-detail-view";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  queryOptions: (value: unknown) => value,
}));
vi.mock("@/features/report/manage", () => ({
  useUpdateProgressReportMutation: () => ({ mutateAsync: mocks.update, isPending: false }),
  usePublishProgressReportMutation: () => ({ mutateAsync: mocks.publish, isPending: false }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const draftReport: ProgressReportDetails = {
  id: "report-1",
  studentProgramId: "program-1",
  learningPeriodId: "period-1",
  status: "DRAFT",
  periodStartedAt: "2026-09-01T10:00:00Z",
  periodEndedAt: "2026-09-30T10:00:00Z",
  learningMinutes: 90,
  snapshotSchemaVersion: 1,
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
    assessment: {
      understandingAverage: 4.5,
      independenceAverage: 4,
      practiceAverage: 3.5,
      homeworkAverage: 5,
    },
    topics: {
      completed: [{ id: "topic-1", title: "Переменные" }],
      inProgress: [{ id: "topic-2", title: "Циклы" }],
    },
    skills: [],
  },
  teacherSummary: "Хороший прогресс",
  nextPeriodPlan: "Изучить функции",
  publishedAt: null,
  version: 7,
  createdAt: "2026-09-30T10:00:00Z",
  updatedAt: "2026-09-30T10:00:00Z",
};

function queryResult(data = draftReport) {
  return { data, isPending: false, isError: false, refetch: mocks.refetch };
}

describe("TeacherStudentReportDetailView", () => {
  beforeEach(() => {
    mocks.useQuery.mockReset().mockReturnValue(queryResult());
    mocks.update.mockReset().mockResolvedValue({ ...draftReport, version: 8 });
    mocks.publish.mockReset().mockResolvedValue({ ...draftReport, status: "PUBLISHED", version: 8 });
    mocks.refetch.mockReset().mockResolvedValue({ data: draftReport });
    vi.restoreAllMocks();
  });

  it("shows the backend snapshot and saves editable draft text with its version", async () => {
    render(<TeacherStudentReportDetailView studentId="student-1" reportId="report-1" />);

    expect(screen.getByText("1 ч 30 мин")).toBeInTheDocument();
    expect(screen.getByText(/75\s*%/)).toBeInTheDocument();
    expect(screen.getByText("3 из 4")).toBeInTheDocument();
    expect(screen.getByText("Переменные")).toBeInTheDocument();
    expect(screen.getByText("Циклы")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Итоги периода"), { target: { value: "  Отличный прогресс  " } });
    fireEvent.change(screen.getByLabelText("План на следующий период"), { target: { value: "  Больше практики  " } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить черновик" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        teacherSummary: "Отличный прогресс",
        nextPeriodPlan: "Больше практики",
        version: 7,
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Черновик сохранён.");
  });

  it("publishes only after confirmation and sends the current version", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TeacherStudentReportDetailView studentId="student-1" reportId="report-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    expect(confirm).toHaveBeenCalledWith("Опубликовать отчёт? После публикации его нельзя будет редактировать.");
    await waitFor(() => expect(mocks.publish).toHaveBeenCalledWith({ version: 7 }));
    expect(await screen.findByRole("status")).toHaveTextContent("Отчёт опубликован.");
  });

  it("explains an optimistic-lock conflict and offers to reload", async () => {
    mocks.update.mockRejectedValue(
      new ApiClientError(409, {
        code: "OPTIMISTIC_LOCK_CONFLICT",
        message: "internal",
        timestamp: "2026-09-30T10:00:00Z",
        traceId: "trace",
        details: [],
      }),
    );
    render(<TeacherStudentReportDetailView studentId="student-1" reportId="report-1" />);

    fireEvent.change(screen.getByLabelText("Итоги периода"), { target: { value: "Новый текст" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить черновик" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Отчёт был изменён в другой вкладке");
    fireEvent.click(screen.getByRole("button", { name: "Обновить данные" }));
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalled());
  });

  it("explains an invalid publish transition", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mocks.publish.mockRejectedValue(
      new ApiClientError(409, {
        code: "PROGRESS_REPORT_NOT_PUBLISHABLE",
        message: "internal",
        timestamp: "2026-09-30T10:00:00Z",
        traceId: "trace",
        details: [],
      }),
    );
    render(<TeacherStudentReportDetailView studentId="student-1" reportId="report-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Отчёт нельзя опубликовать из текущего статуса");
  });

  it("renders a published report as readonly", () => {
    mocks.useQuery.mockReturnValue(
      queryResult({
        ...draftReport,
        status: "PUBLISHED",
        publishedAt: "2026-10-01T10:00:00Z",
        version: 8,
      }),
    );

    render(<TeacherStudentReportDetailView studentId="student-1" reportId="report-1" />);

    expect(screen.getByText("Опубликован")).toBeInTheDocument();
    expect(screen.getByText(/доступен только для чтения/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Сохранить черновик" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Опубликовать" })).not.toBeInTheDocument();
    expect(screen.getByText("Хороший прогресс")).toBeInTheDocument();
    expect(screen.getByText("Изучить функции")).toBeInTheDocument();
  });
});
