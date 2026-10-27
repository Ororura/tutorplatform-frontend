import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeTyping } from "./code-typing";
import { typingExercises } from "../model/exercises";

vi.mock("@/shared/ui/web-preview", () => ({
  WebPreview: ({ files }: { files: Record<string, string> }) => (
    <output aria-label="Preview source">{JSON.stringify(files)}</output>
  ),
}));

function start(id = "css-button") {
  render(<CodeTyping />);
  const exercise = typingExercises.find((item) => item.id === id)!;
  fireEvent.click(screen.getByRole("button", { name: `Начать: ${exercise.title}` }));
  return exercise;
}

afterEach(() => vi.useRealTimers());

describe("CodeTyping", () => {
  it("offers five exercises and commits CSS only after completing the sample", () => {
    const exercise = start();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("spellcheck", "false");
    expect(input).toHaveAccessibleDescription(/Образец текущего шага: background: #2563eb;/);
    fireEvent.change(input, { target: { value: "background:" } });
    expect(screen.getByLabelText("Preview source")).not.toHaveTextContent("#2563eb");
    fireEvent.change(input, { target: { value: exercise.steps[0].text } });
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("Preview source")).toHaveTextContent("background: #2563eb;");
    expect(screen.getByLabelText("Preview source")).not.toHaveTextContent("color: white");
    expect(screen.getByText(/Шаг 2 из 4/)).toBeInTheDocument();
  });

  it("shows errors, retains accuracy history and resets the exercise after finishing", () => {
    const exercise = start();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "x" } });
    expect(screen.getByText("x", { selector: "span" })).toHaveClass(/error/);
    fireEvent.change(input, { target: { value: "xbackground" } });
    expect(input).toHaveValue("x");
    fireEvent.change(input, { target: { value: "" } });
    for (const step of exercise.steps) fireEvent.change(input, { target: { value: step.text } });
    expect(screen.getByRole("region", { name: "Итог упражнения" })).toHaveTextContent("Ошибок: 1");
    expect(screen.getByRole("heading", { name: "Упражнение завершено!" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByLabelText("Preview source")).toHaveTextContent(JSON.stringify(exercise.initial));
    expect(screen.getByText("0 / 4")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "К упражнениям" }));
    expect(screen.getAllByRole("button", { name: /^Начать:/ })).toHaveLength(5);
  });

  it("blocks paste and drop with an explanation and leaves the attempt untouched", () => {
    start();
    const input = screen.getByRole("textbox");
    expect(fireEvent.paste(input, { clipboardData: { getData: () => "background: #2563eb;" } })).toBe(false);
    expect(screen.getByText(/Вставка отключена: наберите код вручную/)).toBeInTheDocument();
    expect(fireEvent.drop(input)).toBe(false);
    expect(input).toHaveValue("");
    expect(screen.getByText("0 / 4")).toBeInTheDocument();
  });

  it("pauses on field, window and tab focus loss; resumes on returning to the field", () => {
    vi.useFakeTimers();
    start();
    const input = screen.getByRole("textbox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "b" } });
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.blur(input);
    expect(screen.getByText(/Пауза. Вернитесь/)).toBeInTheDocument();
    expect(input).toHaveAttribute("readonly");
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText("0:02")).toBeInTheDocument();
    fireEvent.focus(input);
    expect(input).not.toHaveAttribute("readonly");
    act(() => vi.advanceTimersByTime(1000));
    fireEvent(window, new Event("blur"));
    expect(screen.getByText("0:03")).toBeInTheDocument();
    fireEvent.focus(input);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(input).toHaveAttribute("readonly");
    vi.restoreAllMocks();
  });

  it("waits for composition to finish and does not count or apply intermediate IME text", () => {
    start();
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "background: #2563eb;" } });
    expect(screen.getByText("0 / 4")).toBeInTheDocument();
    fireEvent.compositionEnd(input);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    expect(input).toHaveValue("");
    // Some browsers dispatch a final input event after compositionend. It must not enter the next step.
    fireEvent.change(input, { target: { value: "background: #2563eb;" } });
    expect(input).toHaveValue("");
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "color: white;" } });
    fireEvent.blur(input);
    fireEvent.compositionEnd(input);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
