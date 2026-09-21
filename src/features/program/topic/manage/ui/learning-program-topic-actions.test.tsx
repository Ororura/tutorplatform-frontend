import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { CreateLearningProgramTopicDialog, LearningProgramTopicActions } from "./learning-program-topic-actions";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), pending: false }));

vi.mock("../api/manage-learning-program-topic", () => ({
  useCreateLearningProgramTopicMutation: () => ({ mutateAsync: mocks.create, isPending: mocks.pending }),
  useUpdateLearningProgramTopicMutation: () => ({ mutateAsync: mocks.update, isPending: mocks.pending }),
}));

const topic = {
  id: "topic-1",
  slug: "tema",
  title: "Тема",
  description: "Описание",
  position: 0,
  status: "DRAFT" as const,
  version: 3,
};

describe("learning program topic actions", () => {
  beforeEach(() => {
    mocks.pending = false;
    mocks.create.mockReset().mockResolvedValue(topic);
    mocks.update.mockReset().mockResolvedValue(topic);
  });

  it("creates a draft topic from the module", async () => {
    render(<CreateLearningProgramTopicDialog programId="program-1" moduleId="module-1" editable />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить тему" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: " Новая тема " } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ title: "Новая тема", description: null }));
  });

  it("updates title, description, status and version", async () => {
    render(<LearningProgramTopicActions programId="program-1" moduleId="module-1" topic={topic} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: " Обновлённая тема " } });
    fireEvent.change(screen.getByRole("combobox", { name: "Статус" }), { target: { value: "ACTIVE" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        title: "Обновлённая тема",
        description: "Описание",
        status: "ACTIVE",
        version: 3,
      }),
    );
  });

  it("disables submission while saving", () => {
    mocks.pending = true;
    render(<CreateLearningProgramTopicDialog programId="program-1" moduleId="module-1" editable />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить тему" }));
    expect(screen.getByRole("button", { name: "Добавляем…" })).toBeDisabled();
  });

  it("shows a conflict error and hides controls for a read-only program", async () => {
    mocks.update.mockRejectedValueOnce(
      new ApiClientError(409, { code: "CONFLICT", message: "Conflict", timestamp: "", traceId: "", details: [] }),
    );
    const { rerender } = render(
      <LearningProgramTopicActions programId="program-1" moduleId="module-1" topic={topic} editable />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Тема больше не может быть изменена");

    rerender(<LearningProgramTopicActions programId="program-1" moduleId="module-1" topic={topic} editable={false} />);
    expect(screen.queryByRole("button", { name: "Изменить" })).not.toBeInTheDocument();
  });
});
