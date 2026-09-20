import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditLearningProgramDialog } from "./edit-learning-program-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("../api/update-learning-program", () => ({
  useUpdateLearningProgramMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));

const program = {
  id: "program-1",
  subject: { id: "subject-1", name: "Математика" },
  title: "Алгебра",
  description: "Описание",
  status: "DRAFT" as const,
  version: 4,
  createdAt: "2026-09-18T00:00:00Z",
  updatedAt: "2026-09-18T00:00:00Z",
  hasAssignments: false,
  editable: true,
  modules: [],
};

describe("EditLearningProgramDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.mutateAsync.mockResolvedValue(program);
  });

  it("updates only the title, description, and version from the detail", async () => {
    render(<EditLearningProgramDialog program={program} />);
    fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: " Геометрия " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Описание" }), { target: { value: " Новое описание " } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        title: "Геометрия",
        description: "Новое описание",
        version: 4,
      });
    });
    expect(screen.queryByText("Предмет")).not.toBeInTheDocument();
  });
});
