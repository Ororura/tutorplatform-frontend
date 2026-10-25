import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { WebExerciseSolution } from "./web-exercise-solution";
import { webSource, type WebFiles } from "@/shared/lib/web-exercise";
const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  submit: vi.fn(),
  reset: vi.fn(),
  user: "student-a",
  detail: { sourceCode: null as string | null, reviewComment: null as string | null },
}));
vi.mock("@/entities/user", () => ({ useCurrentUserQuery: () => ({ data: { id: mocks.user }, isPending: false }) }));
vi.mock("@tanstack/react-query", () => ({
  queryOptions: (v: unknown) => v,
  useQuery: () => ({ data: mocks.detail, isPending: false }),
}));
vi.mock("@/features/execution/run-code", () => ({
  useRunStudentCodeMutation: () => ({ mutate: mocks.run, reset: mocks.reset, isPending: false }),
}));
vi.mock("@/features/submission/submit-code", () => ({
  useSubmitCodeAnswerMutation: () => ({ mutate: mocks.submit, reset: mocks.reset, isPending: false }),
}));
vi.mock("@/shared/ui/web-files-editor", () => ({
  WebFilesEditor: ({
    files,
    onChange,
    disabled,
  }: {
    files: WebFiles;
    onChange: (files: WebFiles) => void;
    disabled: boolean;
  }) => (
    <textarea
      aria-label="JavaScript"
      value={files.javascript}
      disabled={disabled}
      onChange={(e) => onChange({ ...files, javascript: e.target.value })}
    />
  ),
}));
const starter = {
  html: "<p>Задание</p>",
  css: "",
  javascript: "// старт",
  editableFiles: ["javascript"],
  reviewMode: "AUTO",
  criteria: ["Проверка"],
  hint: "Используйте return",
};
const props = { taskId: "task", context: { homeworkItemId: "item" }, homeworkId: "hw", disabled: false };
beforeEach(() => {
  localStorage.clear();
  mocks.run.mockReset();
  mocks.submit.mockReset();
  mocks.user = "student-a";
  mocks.detail = { sourceCode: null, reviewComment: null };
});
it("saves a draft per account and context, and distinguishes checking from submitting", () => {
  const { unmount } = render(<WebExerciseSolution {...props} starterCode={JSON.stringify(starter)} />);
  fireEvent.change(screen.getByLabelText("JavaScript"), { target: { value: "const n = 1;" } });
  fireEvent.click(screen.getByRole("button", { name: "Проверить" }));
  expect(mocks.run).toHaveBeenCalledWith({
    taskId: "task",
    homeworkItemId: "item",
    sourceCode: webSource({ ...starter, javascript: "const n = 1;" }),
  });
  expect(mocks.submit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Отправить решение" }));
  expect(mocks.submit).toHaveBeenCalled();
  unmount();
  render(<WebExerciseSolution {...props} starterCode={JSON.stringify(starter)} />);
  expect(screen.getByLabelText("JavaScript")).toHaveValue("const n = 1;");
  cleanup();
  mocks.user = "student-b";
  render(<WebExerciseSolution {...props} starterCode={JSON.stringify(starter)} />);
  expect(screen.getByLabelText("JavaScript")).toHaveValue("// старт");
});
it("manual mode sends the files without offering automatic checking", () => {
  render(<WebExerciseSolution {...props} starterCode={JSON.stringify({ ...starter, reviewMode: "MANUAL" })} />);
  expect(screen.queryByRole("button", { name: "Проверить" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Отправить решение" }));
  expect(mocks.submit).toHaveBeenCalled();
});
it("completed homework shows the immutable sent files and teacher feedback", () => {
  mocks.detail = {
    sourceCode: webSource({ ...starter, javascript: "// отправлено" }),
    reviewComment: "Исправьте имена",
  };
  render(<WebExerciseSolution {...props} disabled latestSubmissionId="sent" starterCode={JSON.stringify(starter)} />);
  expect(screen.getByLabelText("JavaScript")).toHaveValue("// отправлено");
  expect(screen.getByLabelText("JavaScript")).toBeDisabled();
  expect(screen.getByText(/Исправьте имена/)).toBeVisible();
});
