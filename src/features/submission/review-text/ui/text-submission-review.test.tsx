import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardQueries } from "@/entities/dashboard";
import { progressQueries } from "@/entities/progress";
import { teacherSubmissionQueries, type TeacherSubmission } from "@/entities/submission";
import { apiClient } from "@/shared/api/client";
import { useReviewTextSubmissionMutation } from "../api/review-text-submission";
import { TextSubmissionReview } from "./text-submission-review";

vi.mock("@/shared/api/client", () => ({
  ApiClientError: class extends Error {},
  apiClient: { PATCH: vi.fn() },
}));
const submission: TeacherSubmission = {
  id: "submission-1",
  studentId: "student-1",
  taskId: "task-1",
  attemptNo: 2,
  status: "NEEDS_REVIEW",
  textAnswer: "Проверяемый текст ответа",
  submittedAt: "2026-10-10T10:00:00Z",
};
function Harness() {
  const review = useReviewTextSubmissionMutation("student-1", "homework-1");
  return <TextSubmissionReview studentId="student-1" submission={submission} review={review} />;
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
  return client;
}

describe("TextSubmissionReview", () => {
  beforeEach(() => vi.mocked(apiClient.PATCH).mockReset());
  it("disables both actions while saving and only confirms the server result", async () => {
    let resolve!: (value: never) => void;
    vi.mocked(apiClient.PATCH).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const client = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    expect(screen.getByText("Попытка 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Принять" }));
    expect(await screen.findByRole("button", { name: "Принимаем…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Не принять" })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await act(async () =>
      resolve({ data: { ...submission, status: "PASSED" }, response: new Response(null, { status: 200 }) } as never),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Решение принято. Изменения сохранены.");
    expect(screen.queryByRole("button", { name: "Принять" })).not.toBeInTheDocument();
    expect(client.getQueryData(teacherSubmissionQueries.detail("student-1", "submission-1").queryKey)).toMatchObject({
      status: "PASSED",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: dashboardQueries.all() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: progressQueries.student("student-1") });
  });
  it("keeps the pending answer and permits retry when saving fails", async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      error: { code: "INTERNAL_ERROR", message: "Save failed" },
      response: new Response(null, { status: 500 }),
    } as never);
    const client = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    fireEvent.click(screen.getByRole("button", { name: "Не принять" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось проверить решение");
    expect(screen.getByRole("button", { name: "Принять" })).toBeEnabled();
    expect(screen.getByText("Проверяемый текст ответа")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(invalidate).not.toHaveBeenCalled();
  });
  it("does not offer review for a server-finalized submission", () => {
    const client = new QueryClient();
    function Finalized() {
      const review = useReviewTextSubmissionMutation("student-1");
      return (
        <TextSubmissionReview studentId="student-1" submission={{ ...submission, status: "FAILED" }} review={review} />
      );
    }
    render(
      <QueryClientProvider client={client}>
        <Finalized />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
