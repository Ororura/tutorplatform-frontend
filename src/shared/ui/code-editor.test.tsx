import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CodeEditor } from "./code-editor";
const configure = vi.hoisted(() => vi.fn());
vi.mock("@monaco-editor/react", () => ({ loader: { config: configure } }));
vi.mock("next/dynamic", () => ({
  default:
    () =>
    ({
      language,
      value,
      onChange,
      options,
    }: {
      language: string;
      value: string;
      onChange: (value: string) => void;
      options: { ariaLabel: string; readOnly: boolean };
    }) => (
      <textarea
        aria-label={options.ariaLabel}
        data-language={language}
        value={value}
        disabled={options.readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
}));

it.each([
  ["JAVA", "java"],
  ["PYTHON", "python"],
] as const)("maps %s to Monaco %s and preserves edits", (language, monaco) => {
  const onChange = vi.fn();
  render(<CodeEditor language={language} value="starter" onChange={onChange} />);
  const editor = screen.getByLabelText("Код решения");
  expect(editor).toHaveAttribute("data-language", monaco);
  expect(editor).toHaveValue("starter");
  fireEvent.change(editor, { target: { value: "solution" } });
  expect(onChange).toHaveBeenCalledWith("solution");
});
