import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { AssessmentForm } from "./assessment-form";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), pending: false }));
vi.mock("../api/save-assessment", () => ({
  useSaveAssessmentMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: mocks.pending }),
}));

const saved = {
  id: "assessment-1",
  lessonSessionId: "session-1",
  understandingScore: 5,
  independenceScore: null,
  practiceScore: 4,
  homeworkScore: null,
  publicComment: "Отличная работа",
  createdAt: "2026-09-14T14:30:00Z",
  updatedAt: "2026-09-14T14:30:00Z",
};

describe("AssessmentForm", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset().mockResolvedValue(saved);
    mocks.pending = false;
  });

  it("saves optional scores and comment using nullable generated fields", async () => {
    const onSaved = vi.fn();
    render(<AssessmentForm studentId="student-1" sessionId="session-1" onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText("Понимание материала"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Практика"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Комментарий для ученика"), {
      target: { value: "  Отличная работа  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить оценку" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        understandingScore: 5,
        independenceScore: null,
        practiceScore: 4,
        homeworkScore: null,
        publicComment: "Отличная работа",
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("rejects non-integer and out-of-range scores before the request", () => {
    render(<AssessmentForm studentId="student-1" sessionId="session-1" onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Понимание материала"), { target: { value: "1.5" } });
    fireEvent.change(screen.getByLabelText("Практика"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить оценку" }));

    expect(screen.getAllByText("Укажите целое число от 1 до 5")).toHaveLength(2);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows backend validation details and a safe save error", async () => {
    mocks.mutateAsync.mockRejectedValue(
      new ApiClientError(400, {
        code: "VALIDATION_ERROR",
        message: "internal",
        timestamp: "2026-01-01T00:00:00Z",
        traceId: "x",
        details: [{ field: "homeworkScore", message: "must be less than or equal to 5" }],
      }),
    );
    render(<AssessmentForm studentId="student-1" sessionId="session-1" onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить оценку" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Проверьте заполненные значения.");
    expect(screen.getByText("Укажите целое число от 1 до 5")).toBeInTheDocument();
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
  });

  it("prefills an existing assessment and allows cancelling editing", () => {
    const onCancel = vi.fn();
    render(
      <AssessmentForm
        assessment={saved}
        studentId="student-1"
        sessionId="session-1"
        onCancel={onCancel}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Понимание материала")).toHaveValue(5);
    expect(screen.getByLabelText("Комментарий для ученика")).toHaveValue("Отличная работа");
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
