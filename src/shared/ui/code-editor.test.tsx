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
      theme,
      height,
    }: {
      language: string;
      value: string;
      onChange: (value: string) => void;
      options: { ariaLabel: string; readOnly: boolean };
      theme: string;
      height: string;
    }) => (
      <textarea
        aria-label={options.ariaLabel}
        data-language={language}
        data-theme={theme}
        data-height={height}
        data-options={JSON.stringify(options)}
        value={value}
        disabled={options.readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
}));

it.each([
  ["JAVA", "java"],
  ["PYTHON", "python"],
  ["html", "html"],
  ["css", "css"],
  ["javascript", "javascript"],
] as const)("maps %s to Monaco %s and preserves edits", (language, monaco) => {
  const onChange = vi.fn();
  render(<CodeEditor language={language} value="starter" onChange={onChange} />);
  const editor = screen.getByLabelText("Код решения");
  expect(editor).toHaveAttribute("data-language", monaco);
  expect(editor).toHaveValue("starter");
  expect(editor).toHaveAttribute("data-theme", "vs");
  expect(editor).toHaveAttribute("data-height", "20rem");
  fireEvent.change(editor, { target: { value: "solution" } });
  expect(onChange).toHaveBeenCalledWith("solution");
});

it("configures the workspace without changing the default editor contract", () => {
  render(
    <CodeEditor
      language="css"
      value="body {}"
      onChange={vi.fn()}
      appearance="workspace"
      label="Файл styles.css"
      disabled
    />,
  );
  const editor = screen.getByLabelText("Файл styles.css");
  expect(editor).toBeDisabled();
  expect(editor).toHaveAttribute("data-theme", "vs-dark");
  expect(JSON.parse(editor.getAttribute("data-options")!)).toMatchObject({
    tabSize: 2,
    insertSpaces: true,
    wordWrap: "on",
    lineNumbers: "on",
    readOnly: true,
  });
});
