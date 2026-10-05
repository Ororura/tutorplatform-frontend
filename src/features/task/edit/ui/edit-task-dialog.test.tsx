import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { EditTaskDialog } from "./edit-task-dialog";
import type { Task } from "@/entities/task";
const save = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock("../api/update-task", () => ({ useUpdateTaskMutation: () => ({ mutateAsync: save, isPending: false }) }));

it("loads saved Java language and starter, preserves it when changing language, and saves config", async () => {
  const task = {
    id: "task",
    title: "Java",
    descriptionMarkdown: "desc",
    difficulty: "EASY",
    status: "DRAFT",
    version: 1,
    programmingConfig: {
      language: "JAVA",
      starterCode: "class Main {}",
      executionEnabled: true,
      timeLimitMs: 5000,
      memoryLimitMb: 128,
    },
  } as Task;
  render(<EditTaskDialog task={task} />);
  fireEvent.click(screen.getByRole("button", { name: "Редактировать" }));
  expect(screen.getByLabelText("Язык")).toHaveValue("JAVA");
  expect(screen.getByLabelText("Стартовый код")).toHaveValue("class Main {}");
  fireEvent.change(screen.getByLabelText("Язык"), { target: { value: "PYTHON" } });
  expect(screen.getByLabelText("Стартовый код")).toHaveValue("class Main {}");
  fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        programmingConfig: expect.objectContaining({ language: "PYTHON", starterCode: "class Main {}" }),
      }),
    ),
  );
});
