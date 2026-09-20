import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateLearningProgramModuleDialog, LearningProgramModuleActions } from "./learning-program-module-actions";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../api/manage-learning-program-module", () => ({
  useCreateLearningProgramModuleMutation: () => ({ mutateAsync: mocks.create, isPending: false }),
  useUpdateLearningProgramModuleMutation: () => ({ mutateAsync: mocks.update, isPending: false }),
  useDeleteLearningProgramModuleMutation: () => ({ mutateAsync: mocks.remove, isPending: false }),
}));

const programModule = { id: "module-1", title: "Основы", description: "Введение", position: 0, topics: [] };

describe("learning program module actions", () => {
  beforeEach(() => {
    mocks.create.mockReset().mockResolvedValue({ id: "module-new" });
    mocks.update.mockReset().mockResolvedValue(programModule);
    mocks.remove.mockReset().mockResolvedValue(undefined);
  });

  it("creates a module and expands it through the callback", async () => {
    const onCreated = vi.fn();
    render(<CreateLearningProgramModuleDialog programId="program-1" editable onCreated={onCreated} />);
    fireEvent.click(screen.getByRole("button", { name: "Добавить модуль" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: " Новый модуль " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Описание" }), { target: { value: " Описание " } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ title: "Новый модуль", description: "Описание" }));
    expect(onCreated).toHaveBeenCalledWith("module-new");
  });

  it("edits an empty module only after opening the form", async () => {
    render(<LearningProgramModuleActions programId="program-1" module={programModule} editable />);
    fireEvent.click(screen.getByRole("button", { name: "Изменить" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Название" }), { target: { value: " Обновлённый " } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ title: "Обновлённый", description: "Введение" }));
  });

  it("asks for confirmation before deleting an empty module", async () => {
    render(<LearningProgramModuleActions programId="program-1" module={programModule} editable />);
    fireEvent.click(screen.getAllByRole("button", { name: "Удалить" }).at(-1)!);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Удалить модуль?" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Удалить" }).at(-1)!);
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledOnce());
  });

  it("hides mutations for read-only programs and deletion for a non-empty module", () => {
    const { rerender } = render(
      <LearningProgramModuleActions programId="program-1" module={programModule} editable={false} />,
    );
    expect(screen.queryByRole("button", { name: "Изменить" })).not.toBeInTheDocument();
    rerender(
      <LearningProgramModuleActions
        programId="program-1"
        module={{
          ...programModule,
          topics: [{ id: "topic-1", title: "Тема", description: null, position: 0, status: "DRAFT", version: 1 }],
        }}
        editable
      />,
    );
    expect(screen.getByRole("button", { name: "Изменить" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить" })).not.toBeInTheDocument();
  });
});
