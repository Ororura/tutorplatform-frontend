import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchiveLearningProgramButton } from "./archive-learning-program-button";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("../api/archive-learning-program", () => ({
  useArchiveLearningProgramMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

describe("ArchiveLearningProgramButton", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.mutateAsync.mockResolvedValue({ id: "program-1", status: "ARCHIVED" });
  });

  it("requires confirmation before archiving", async () => {
    render(<ArchiveLearningProgramButton programId="program-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Архивировать" }));
    expect(screen.getByRole("heading", { name: "Архивировать программу?" })).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Архивировать" })[1]);
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith("program-1"));
  });
});
