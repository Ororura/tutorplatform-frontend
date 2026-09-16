import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentDetailQueryState } from "./student-detail-query-state";
import { ApiClientError } from "@/shared/api/client";

describe("StudentDetailQueryState", () => {
  it("renders loading state", () => {
    render(<StudentDetailQueryState isPending isError={false} onRetry={vi.fn()} />);
    expect(screen.getByText("Загружаем ученика…")).toHaveAttribute("aria-busy", "true");
  });

  it("renders error state and retries", () => {
    const onRetry = vi.fn();
    render(<StudentDetailQueryState isPending={false} isError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows the same safe not-found message for every 404", () => {
    const error = new ApiClientError(404, {
      code: "STUDENT_NOT_FOUND",
      message: "internal ownership-safe message",
      timestamp: "2026-09-13T00:00:00Z",
      traceId: "trace",
      details: [],
    });
    render(<StudentDetailQueryState isPending={false} isError error={error} onRetry={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Ученик не найден" })).toBeInTheDocument();
    expect(screen.queryByText(error.body.message)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });
});
