import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/client";
import { TeacherStudentContext } from "./teacher-student-context";

vi.mock("@/shared/api/client", () => ({ ApiClientError: class extends Error {}, apiClient: { GET: vi.fn() } }));
const empty = { items: [], page: 0, size: 1, totalElements: 0, totalPages: 0 };
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TeacherStudentContext studentId="student-1" />
    </QueryClientProvider>,
  );
  return client;
}

describe("TeacherStudentContext", () => {
  beforeEach(() => {
    vi.mocked(apiClient.GET).mockReset();
  });
  it("distinguishes unavailable data from an empty server result and can retry one indicator", async () => {
    vi.mocked(apiClient.GET).mockImplementation(
      async (path: string) =>
        ({
          data: path.endsWith("/sessions") ? undefined : empty,
          error: path.endsWith("/sessions") ? { code: "ERROR" } : undefined,
          response: new Response(null, { status: path.endsWith("/sessions") ? 500 : 200 }),
        }) as never,
    );
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Данные недоступны");
    expect(await screen.findByText("Нет активных домашних заданий")).toBeInTheDocument();
    expect(screen.getByText("Нет работ на проверку")).toBeInTheDocument();
    expect(screen.getByText("Нет периодов, ожидающих отчёта")).toBeInTheDocument();
    expect(screen.queryByText("Проведённых занятий пока нет")).not.toBeInTheDocument();
    const before = vi.mocked(apiClient.GET).mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Повторить: Последнее проведённое занятие" }));
    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledTimes(before + 1));
  });
  it("uses accurate totals and navigates to the owned student's resources", async () => {
    vi.mocked(apiClient.GET).mockImplementation(async (path: string) => {
      const item = path.endsWith("/sessions")
        ? { id: "session-1", startedAt: "2026-10-10T10:00:00Z" }
        : path.endsWith("/homeworks")
          ? { title: "Текстовое ДЗ" }
          : path.endsWith("/submissions")
            ? { id: "submission-1" }
            : {
                type: "LEARNING_PERIOD_REPORT_MISSING",
                studentId: "student-1",
                resourceId: "period-1",
                navigation: { studentProgramId: "program-1", reportId: "report-1" },
              };
      return {
        data: { ...empty, items: [item], totalElements: 7 },
        response: new Response(null, { status: 200 }),
      } as never;
    });
    setup();
    const homework = await screen.findByRole("link", { name: /Активные домашние задания.*7 · Текстовое ДЗ/ });
    expect(homework).toHaveAttribute("href", "/teacher/students/student-1/homework?status=ASSIGNED");
    expect(screen.getByRole("link", { name: /Последнее проведённое занятие/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/sessions/session-1",
    );
    expect(screen.getByRole("link", { name: /Работы, ожидающие проверки/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/submissions/submission-1",
    );
    expect(screen.getByRole("link", { name: /Готовые отчётные периоды/ })).toHaveAttribute(
      "href",
      "/teacher/students/student-1/reports/report-1",
    );
    expect(apiClient.GET).toHaveBeenCalledWith(
      "/api/v1/teacher/students/{studentId}/sessions",
      expect.objectContaining({
        params: {
          path: { studentId: "student-1" },
          query: expect.objectContaining({ attendanceStatus: "ATTENDED", startedBefore: expect.any(String), size: 1 }),
        },
      }),
    );
  });
  it("shows pending indicators without fabricated empty values", () => {
    vi.mocked(apiClient.GET).mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getAllByRole("status")).toHaveLength(4);
    expect(screen.queryByText("Нет работ на проверку")).not.toBeInTheDocument();
  });
});
