import { useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebPractice } from "./web-practice";
import { createPracticeTask } from "../model/tasks";

vi.mock("@/shared/ui/code-editor", () => ({
  CodeEditor: ({
    value,
    onChange,
    disabled,
    label,
  }: {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    label: string;
  }) => (
    <textarea aria-label={label} value={value} readOnly={disabled} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock("@/shared/ui/web-preview", () => ({
  WebPreview: ({ files }: { files: Record<string, string> }) => {
    const snapshot = useRef(files);
    return <output data-testid="preview-source">{JSON.stringify(snapshot.current)}</output>;
  },
}));

beforeEach(() => vi.spyOn(Math, "random").mockReturnValue(0));
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function start(technology = "all") {
  render(<WebPractice />);
  fireEvent.change(screen.getByLabelText("Технология"), { target: { value: technology } });
  fireEvent.click(screen.getByRole("button", { name: "Начать поток" }));
}
const editor = (name = "index.html") => screen.getByRole("textbox", { name: `Код файла ${name}` });

describe("WebPractice", () => {
  it("provides a project editor, preserves each file and only runs after explicit launch", () => {
    start();
    expect(editor()).toHaveValue(createPracticeTask("all", 0, 0).starter.html);
    fireEvent.change(editor(), { target: { value: '<h1 id="manual">Моя работа</h1>' } });
    expect(screen.getAllByTestId("preview-source")[0]).not.toHaveTextContent("Моя работа");
    fireEvent.click(screen.getByRole("tab", { name: "styles.css" }));
    fireEvent.change(editor("styles.css"), { target: { value: "h1 { color: red; }" } });
    fireEvent.click(screen.getByRole("tab", { name: "index.html" }));
    expect(editor()).toHaveValue('<h1 id="manual">Моя работа</h1>');
    fireEvent.keyDown(editor(), { key: "Enter", ctrlKey: true });
    expect(screen.getAllByTestId("preview-source")[0]).toHaveTextContent("Моя работа");
    expect(screen.getAllByTestId("preview-source")[0]).toHaveTextContent("h1 { color: red; }");
  });

  it("locks the supplied files for a single technology and supports keyboard file tabs", () => {
    start("css");
    expect(editor("styles.css")).not.toHaveAttribute("readonly");
    fireEvent.keyDown(screen.getByRole("tab", { name: "styles.css" }), { key: "ArrowLeft" });
    expect(editor()).toHaveAttribute("readonly");
    expect(screen.getByRole("tab", { name: /index.html/ })).toHaveFocus();
    expect(screen.getByRole("tab", { name: /index.html/ })).toHaveAttribute("aria-selected", "true");
  });

  it("requires manual self-assessment, clears marks after edits and resets everything for the next task", () => {
    vi.useFakeTimers();
    start();
    const next = screen.getByRole("button", { name: "Я проверил — следующее задание" });
    expect(next).toBeDisabled();
    for (const checkbox of screen.getAllByRole("checkbox")) fireEvent.click(checkbox);
    expect(next).toBeEnabled();
    fireEvent.change(editor(), { target: { value: "changed" } });
    expect(next).toBeDisabled();
    for (const checkbox of screen.getAllByRole("checkbox")) fireEvent.click(checkbox);
    act(() => vi.advanceTimersByTime(65000));
    expect(screen.getByLabelText("Время работы")).toHaveTextContent("1:05");
    fireEvent.click(next);
    expect(screen.getByLabelText("Время работы")).toHaveTextContent("0:00");
    expect(screen.getByRole("status")).toHaveTextContent("Задание 2");
    expect(editor()).toHaveValue(createPracticeTask("all", 0, 1).starter.html);
    expect(screen.getAllByRole("checkbox").every((item) => !(item as HTMLInputElement).checked)).toBe(true);
  });

  it("confirms skipping and leaving, keeps code on cancellation and resets files on request", () => {
    start();
    fireEvent.change(editor(), { target: { value: "work" } });
    fireEvent.click(screen.getByRole("button", { name: "Пропустить" }));
    fireEvent.click(screen.getByRole("button", { name: "Остаться в задании" }));
    expect(editor()).toHaveValue("work");
    fireEvent.click(screen.getByRole("button", { name: "Сбросить файлы" }));
    fireEvent.click(screen.getByRole("button", { name: "Вернуть исходные файлы" }));
    expect(editor()).toHaveValue(createPracticeTask("all", 0, 0).starter.html);
    fireEvent.click(screen.getByRole("button", { name: "Пропустить" }));
    fireEvent.click(screen.getByRole("button", { name: "Перейти к следующему" }));
    expect(screen.getByRole("status")).toHaveTextContent("Задание 2");
    fireEvent.click(screen.getByRole("button", { name: "Изменить практику" }));
    fireEvent.click(screen.getByRole("button", { name: "Вернуться к настройкам" }));
    expect(screen.getByRole("button", { name: "Начать поток" })).toBeVisible();
  });

  it("continues the gray-sample stream after an exercise without returning to the catalog", () => {
    render(<WebPractice />);
    fireEvent.change(screen.getByLabelText("Технология"), { target: { value: "javascript" } });
    fireEvent.click(screen.getByRole("radio", { name: /^Набор по серому образцу/ }));
    fireEvent.click(screen.getByRole("button", { name: "Начать поток" }));
    const task = createPracticeTask("javascript", 0, 0);
    for (const step of task.typing.steps)
      fireEvent.change(screen.getByRole("textbox"), { target: { value: step.text } });
    fireEvent.click(screen.getByRole("button", { name: "Следующее задание" }));
    expect(screen.getAllByRole("status").some((item) => item.textContent?.includes("Задание 2"))).toBe(true);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Начать поток" })).not.toBeInTheDocument();
  });
});
