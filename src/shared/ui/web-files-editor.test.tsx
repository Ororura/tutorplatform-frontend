import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { WebFilesEditor } from "./web-files-editor";
vi.mock("./code-editor", () => ({
  CodeEditor: ({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (s: string) => void }) => (
    <textarea
      aria-label="Код решения"
      value={value}
      readOnly={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
it("opens the editable file and preserves locked files while switching tabs", () => {
  const onChange = vi.fn();
  render(
    <WebFilesEditor
      files={{ html: "<p>Старт</p>", css: "p {}", javascript: "" }}
      editableFiles={["css"]}
      onChange={onChange}
    />,
  );
  expect(screen.getByLabelText("Код решения")).toHaveValue("p {}");
  fireEvent.change(screen.getByLabelText("Код решения"), { target: { value: "p { color: red; }" } });
  expect(onChange).toHaveBeenCalledWith({ html: "<p>Старт</p>", css: "p { color: red; }", javascript: "" });
  fireEvent.click(screen.getByRole("tab", { name: /index.html/ }));
  expect(screen.getByLabelText("Код решения")).toHaveAttribute("readonly");
  const frame = screen.getByTitle("Результат HTML, CSS и JavaScript");
  expect(frame).toHaveAttribute("sandbox", "allow-scripts");
  expect(frame).toHaveAttribute("src", "/web-preview");
});
