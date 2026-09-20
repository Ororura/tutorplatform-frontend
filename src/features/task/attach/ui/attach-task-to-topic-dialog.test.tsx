import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AttachTaskToTopicDialog } from "./attach-task-to-topic-dialog";

const mocks = vi.hoisted(() => {
  class ApiClientError extends Error {
    constructor(
      public status: number,
      public body: { code: string },
    ) {
      super("API error");
    }
  }

  return { mutateAsync: vi.fn(), ApiClientError };
});

vi.mock("../api/attach-task-to-topic", () => ({
  useAttachTaskToTopicMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@/shared/api/client", () => ({ ApiClientError: mocks.ApiClientError }));

const tasks = [
  { id: "task-1", title: "Линейное уравнение", taskType: "TEXT", difficulty: "EASY" },
  { id: "task-2", title: "Квадратное уравнение", taskType: "CODE", difficulty: "HARD" },
] as never;

describe("AttachTaskToTopicDialog", () => {
  beforeEach(() => mocks.mutateAsync.mockReset().mockResolvedValue(undefined));

  it("filters the task bank locally, excludes attached tasks and uses the next position", async () => {
    render(
      <AttachTaskToTopicDialog
        topicId="topic-1"
        tasks={tasks}
        attachedTasks={[{ taskId: "task-1", position: 4, required: true }] as never}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Прикрепить задание" }));
    expect(screen.queryByText("Линейное уравнение")).not.toBeInTheDocument();
    expect(screen.getByText("Квадратное уравнение")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Поиск по названию" }), { target: { value: "квадрат" } });
    fireEvent.click(screen.getByRole("button", { name: "Выбрать" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({ taskId: "task-2", position: 5, required: true }),
    );
  });

  it("allows an optional assignment and explains subject and conflict errors", async () => {
    const { rerender } = render(
      <AttachTaskToTopicDialog topicId="topic-1" tasks={tasks} attachedTasks={[] as never} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Прикрепить задание" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Обязательное задание" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Выбрать" })[0]);
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({ taskId: "task-1", position: 0, required: false }),
    );

    mocks.mutateAsync.mockRejectedValueOnce(new mocks.ApiClientError(400, { code: "TASK_SUBJECT_MISMATCH" }));
    rerender(<AttachTaskToTopicDialog topicId="topic-1" tasks={tasks} attachedTasks={[] as never} />);
    fireEvent.click(screen.getByRole("button", { name: "Прикрепить задание" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Выбрать" })[0]);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("предмету этой программы"));

    mocks.mutateAsync.mockRejectedValueOnce(new mocks.ApiClientError(409, { code: "TASK_ALREADY_ATTACHED" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Выбрать" })[0]);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("уже прикреплено"));
  });
});
