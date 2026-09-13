import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentDetailQueryState } from "./student-detail-query-state";

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
});
