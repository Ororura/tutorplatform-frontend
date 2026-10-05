import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { CreateTaskDialog } from "./create-task-dialog";

const mocks = vi.hoisted(() => ({ create: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [{ id: "subject", name: "Java", status: "ACTIVE" }] }),
  queryOptions: (x: unknown) => x,
}));
vi.mock("../api/create-task", () => ({
  useCreateTaskMutation: () => ({ mutateAsync: mocks.create, isPending: false }),
}));
beforeEach(() => {
  mocks.create.mockReset().mockResolvedValue({ id: "task" });
});

it("teacher selects Java and saves the config and suggested starter", async () => {
  render(<CreateTaskDialog />);
  fireEvent.click(screen.getByRole("button", { name: "Создать задание" }));
  fireEvent.change(screen.getByLabelText("Предмет"), { target: { value: "subject" } });
  fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Квадрат" } });
  fireEvent.change(screen.getByLabelText("Описание Markdown"), { target: { value: "Введите число" } });
  fireEvent.change(screen.getByLabelText("Тип"), { target: { value: "CODE" } });
  fireEvent.change(screen.getByLabelText("Язык"), { target: { value: "JAVA" } });
  expect((screen.getByLabelText("Стартовый код") as HTMLTextAreaElement).value).toContain("public class Main");
  fireEvent.change(screen.getByLabelText("Ожидаемый вывод теста 1"), { target: { value: "25" } });
  fireEvent.click(screen.getByRole("button", { name: "Создать" }));
  await waitFor(() =>
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        programmingConfig: expect.objectContaining({
          language: "JAVA",
          starterCode: expect.stringContaining("public class Main"),
        }),
      }),
    ),
  );
});

it("language switching preserves teacher code", () => {
  render(<CreateTaskDialog />);
  fireEvent.click(screen.getByRole("button", { name: "Создать задание" }));
  fireEvent.change(screen.getByLabelText("Тип"), { target: { value: "CODE" } });
  fireEvent.change(screen.getByLabelText("Стартовый код"), { target: { value: "teacher code" } });
  fireEvent.change(screen.getByLabelText("Язык"), { target: { value: "JAVA" } });
  expect(screen.getByLabelText("Стартовый код")).toHaveValue("teacher code");
  fireEvent.change(screen.getByLabelText("Язык"), { target: { value: "PYTHON" } });
  expect(screen.getByLabelText("Стартовый код")).toHaveValue("teacher code");
});
