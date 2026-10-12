import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardQueries } from "@/entities/dashboard";
import { homeworkQueries } from "@/entities/homework";
import { progressQueries } from "@/entities/progress";
import { reportQueries } from "@/entities/report";
import { sessionQueries } from "@/entities/session";
import { teacherSubmissionQueries } from "@/entities/submission";
import {
  useCreateHomeworkMutation,
  useUpdateHomeworkMutation,
} from "@/features/homework/create/api/homework-mutations";
import { useCancelHomeworkMutation } from "@/features/homework/cancel";
import { useCreateSessionMutation, useUpdateSessionMutation } from "@/features/session/manage/api/session-mutations";
import { useCreateProgressReportMutation, usePublishProgressReportMutation } from "@/features/report/manage";
import { useReviewTextSubmissionMutation } from "@/features/submission/review-text";
import { apiClient } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { POST: vi.fn(), PATCH: vi.fn() },
}));

const studentId = "student-1";
const programId = "program-1";
const keys = {
  dashboard: dashboardQueries.teacher().queryKey,
  queue: dashboardQueries.attention({ page: 0, size: 20 }).queryKey,
  contextReport: dashboardQueries.attention({ studentId, type: "LEARNING_PERIOD_REPORT_MISSING", size: 1 }).queryKey,
  homework: homeworkQueries.list(studentId, { page: 0, status: "ASSIGNED" }).queryKey,
  progress: progressQueries.detail(studentId, programId).queryKey,
  sessions: sessionQueries.latestConducted(studentId).queryKey,
  periods: reportQueries.learningPeriods(studentId, programId).queryKey,
  reports: reportQueries.list({ studentProgramId: programId }).queryKey,
  submissions: teacherSubmissionQueries.list(studentId, { status: "NEEDS_REVIEW", size: 1 }).queryKey,
  foreignProgress: progressQueries.detail("other-student", programId).queryKey,
};
const cases = [
  {
    name: "create homework",
    useMutation: () => useCreateHomeworkMutation(studentId),
    input: { title: "ДЗ", studentProgramId: programId, items: [] },
    refresh: ["homework", "progress"],
  },
  {
    name: "update homework",
    useMutation: () => useUpdateHomeworkMutation(studentId, "homework-1"),
    input: { title: "ДЗ", items: [], version: 0 },
    refresh: ["homework", "progress"],
  },
  {
    name: "cancel homework",
    useMutation: () => useCancelHomeworkMutation(studentId, "homework-1"),
    input: undefined,
    refresh: ["homework", "progress"],
  },
  {
    name: "create session",
    useMutation: () => useCreateSessionMutation(studentId),
    input: {
      studentProgramId: programId,
      topics: [],
      attendanceStatus: "ATTENDED",
      startedAt: "2026-10-10T10:00:00Z",
      durationMinutes: 60,
    },
    refresh: ["sessions", "progress", "periods"],
  },
  {
    name: "update session",
    useMutation: () => useUpdateSessionMutation(studentId, "session-1"),
    input: {
      topics: [],
      attendanceStatus: "ATTENDED",
      startedAt: "2026-10-10T10:00:00Z",
      durationMinutes: 60,
      version: 0,
    },
    refresh: ["sessions", "progress", "periods"],
  },
  {
    name: "generate report",
    useMutation: () => useCreateProgressReportMutation(),
    input: { studentProgramId: programId, learningPeriodId: "period-1" },
    refresh: ["periods", "reports"],
  },
  {
    name: "publish report",
    useMutation: () => usePublishProgressReportMutation("report-1"),
    input: { version: 0 },
    refresh: ["periods", "reports"],
  },
  {
    name: "review submission",
    useMutation: () => useReviewTextSubmissionMutation(studentId, "homework-1"),
    input: { studentId, submissionId: "submission-1", status: "PASSED" },
    refresh: ["submissions", "homework", "progress"],
  },
] as const;

describe("daily workflow invalidation", () => {
  beforeEach(() => {
    vi.mocked(apiClient.POST).mockReset();
    vi.mocked(apiClient.PATCH).mockReset();
  });
  it.each(cases)("$name refreshes affected reads without invalidating unrelated students", async (scenario) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    Object.values(keys).forEach((key) => client.setQueryData(key, {} as never));
    const response = {
      data: { id: "saved-1", status: "PASSED", studentId, studentProgramId: programId },
      response: new Response(null, { status: 200 }),
    } as never;
    vi.mocked(apiClient.POST).mockResolvedValue(response);
    vi.mocked(apiClient.PATCH).mockResolvedValue(response);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const useScenarioMutation = scenario.useMutation;
    const { result } = renderHook(
      () => {
        const mutation = useScenarioMutation();
        return { run: (input: never) => mutation.mutateAsync(input) };
      },
      { wrapper },
    );
    await act(async () => {
      await result.current.run(scenario.input as never);
    });
    for (const name of ["dashboard", "queue", "contextReport", ...scenario.refresh] as (keyof typeof keys)[]) {
      expect(client.getQueryState(keys[name])?.isInvalidated, `${scenario.name}: ${name}`).toBe(true);
    }
    expect(client.getQueryState(keys.foreignProgress)?.isInvalidated).toBe(false);
  });
});
