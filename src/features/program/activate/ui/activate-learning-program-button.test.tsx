import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActivateLearningProgramButton } from "./activate-learning-program-button";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock("../api/activate-learning-program", () => ({
  useActivateLearningProgramMutation: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

describe("ActivateLearningProgramButton", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.mutateAsync.mockResolvedValue({
      id: "program-1",
      status: "ACTIVE",
    });
  });

  it("activates selected program", async () => {
    render(<ActivateLearningProgramButton programId="program-1" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Активировать",
      }),
    );

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith("program-1");
    });
  });

  it("shows fallback error when activation fails", async () => {
    mocks.mutateAsync.mockRejectedValue(new Error("Network failure"));

    render(<ActivateLearningProgramButton programId="program-1" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Активировать",
      }),
    );

    expect(await screen.findByText("Не удалось активировать программу.")).toBeInTheDocument();
  });
});
