import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { ContentPackagePreviewValidationError } from "../model/content-package";
import { ImportContentPackageDialog } from "./import-content-package-dialog";

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  importPackage: vi.fn(),
}));

vi.mock("../api/preview-content-package", () => ({
  usePreviewContentPackageMutation: () => ({ mutateAsync: mocks.preview }),
}));
vi.mock("../api/import-content-package", () => ({
  useImportContentPackageMutation: () => ({ mutateAsync: mocks.importPackage }),
}));

const digest = "a".repeat(64);
const confirmationId = "123e4567-e89b-42d3-a456-426614174000";
const preview = {
  valid: true,
  digest,
  programId: "program-1",
  moduleCount: 1,
  topicCount: 1,
  materialCount: 4,
  modules: [
    {
      title: "Модуль 1",
      topics: [
        {
          title: "Тема 1",
          materials: [
            { title: "Текст", materialType: "TEXT", content: "Первая строка\nВторая строка" },
            { title: "Разметка", materialType: "MARKDOWN", content: "## Заголовок Markdown\n\n**Важный текст**" },
            { title: "Код", materialType: "CODE_EXAMPLE", content: "console.log('safe')" },
            { title: "Ссылка", materialType: "LINK", externalUrl: "https://example.org/lesson" },
          ],
        },
      ],
    },
  ],
};
const imported = {
  programId: "program-1",
  confirmationId,
  digest,
  moduleCount: 1,
  topicCount: 1,
  materialCount: 4,
  createdModuleIds: ["module-1"],
};

function apiError(status: number, code: string, details: { field: string; message: string }[] = []) {
  return new ApiClientError(status, {
    code,
    message: "Backend error",
    details,
    timestamp: "2026-09-25T00:00:00Z",
    traceId: "",
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function openDialog() {
  render(<ImportContentPackageDialog programId="program-1" editable />);
  fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
  return screen.getByRole("dialog", { name: "Импорт учебных модулей" });
}

function selectFile(name = "modules.yaml") {
  const file = new File(["modules: []"], name);
  fireEvent.change(screen.getByLabelText(/(?:Выберите YAML-файл|Заменить файл)/), { target: { files: [file] } });
  return file;
}

async function checkFile() {
  fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Импортировать 1 модулей" })).toBeEnabled());
}

describe("ImportContentPackageDialog", () => {
  beforeEach(() => {
    mocks.preview.mockReset().mockResolvedValue(preview);
    mocks.importPackage.mockReset().mockResolvedValue(imported);
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => confirmationId) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("opens, validates file choice and clears errors on close", () => {
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Выберите YAML-файл.");
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать модули" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects unsupported extensions and oversized files locally", () => {
    openDialog();
    selectFile("modules.txt");
    expect(screen.getByRole("alert")).toHaveTextContent("Поддерживаются только файлы");
    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    expect(mocks.preview).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Заменить файл"), {
      target: { files: [new File([new Uint8Array(1_048_577)], "large.yaml")] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("1 МиБ");
  });

  it("offers both downloads without clearing the selected file", () => {
    const dialog = openDialog();
    const file = selectFile();
    const template = within(dialog).getByRole("link", { name: "Скачать шаблон YAML" });
    const example = within(dialog).getByRole("link", { name: "Скачать заполненный пример" });

    expect(template).toHaveAttribute("href", "/templates/tutor-content-package.yaml");
    expect(example).toHaveAttribute("href", "/templates/python-conditions.yaml");
    expect(template).toHaveAttribute("download");
    expect(example).toHaveAttribute("download");
    expect(dialog).toHaveTextContent(
      "Шаблон содержит структуру модулей, тем и материалов. Замените примерное содержимое своим и загрузите файл обратно.",
    );

    template.addEventListener("click", (event) => event.preventDefault());
    example.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(template);
    fireEvent.click(example);
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("modules.yaml · 11 Б");
    fireEvent.click(within(dialog).getByRole("button", { name: "Проверить файл" }));
    expect(mocks.preview).toHaveBeenCalledWith(file);
  });

  it("shows preview loading, counts, tree and draft material rendering", async () => {
    const pending = deferred<typeof preview>();
    mocks.preview.mockReturnValueOnce(pending.promise);
    openDialog();
    const file = selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    expect(screen.getByRole("status")).toHaveTextContent("Проверяем файл");
    expect(screen.getByRole("button", { name: "Проверить файл" })).toBeDisabled();
    expect(screen.getByLabelText("Заменить файл")).toBeDisabled();
    expect(mocks.preview).toHaveBeenCalledWith(file);
    pending.resolve(preview);

    await waitFor(() => expect(screen.getByText("Модулей: 1")).toBeInTheDocument());
    expect(screen.getByText("Тем: 1")).toBeInTheDocument();
    expect(screen.getByText("Материалов: 4")).toBeInTheDocument();
    expect(screen.getByText("modules.yaml · 11 Б")).toBeInTheDocument();
    const tree = screen.getByRole("region", { name: "Предварительный просмотр модулей" });
    expect(within(tree).getByRole("heading", { name: "Модуль 1" })).toBeInTheDocument();
    expect(within(tree).getByRole("heading", { name: "Тема 1" })).toBeInTheDocument();
    expect(within(tree).getByText("TEXT")).toBeInTheDocument();
    expect(within(tree).getByText("MARKDOWN")).toBeInTheDocument();
    expect(within(tree).getByText("CODE_EXAMPLE")).toBeInTheDocument();
    expect(within(tree).getByText("LINK")).toBeInTheDocument();
    expect(within(tree).getByText(/Первая строка/)).toHaveClass("whitespace-pre-wrap");
    expect(within(tree).getByRole("heading", { name: "Заголовок Markdown" })).toBeInTheDocument();
    expect(within(tree).getByText("Важный текст", { selector: "strong" })).toBeInTheDocument();
    expect(within(tree).getByText("console.log('safe')").closest("pre")).toHaveClass("overflow-x-auto");
    expect(within(tree).getByRole("link", { name: "https://example.org/lesson" })).toHaveAttribute(
      "href",
      "https://example.org/lesson",
    );
  });

  it("shows YAML validation paths without closing the dialog", async () => {
    mocks.preview.mockRejectedValueOnce(
      new ContentPackagePreviewValidationError(400, [
        { code: "REQUIRED_FIELD", path: "modules[0].topics[1].materials[2].content", message: "Content is required" },
      ]),
    );
    openDialog();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("modules[0].topics[1].materials[2].content"),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Content is required");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Проверить файл" })).toBeEnabled();
  });

  it("shows API error details for a preview response", async () => {
    mocks.preview.mockRejectedValueOnce(
      apiError(400, "VALIDATION_ERROR", [{ field: "modules[0].title", message: "Required" }]),
    );
    openDialog();
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Проверить файл" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("modules[0].title: Required"));
  });

  it("confirms exactly once, sends the original file and digest, and shows success", async () => {
    const pending = deferred<typeof imported>();
    mocks.importPackage.mockReturnValueOnce(pending.promise);
    openDialog();
    const file = selectFile();
    await checkFile();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать 1 модулей" }));
    expect(screen.getByRole("status")).toHaveTextContent("Импортируем модули");
    expect(mocks.importPackage).toHaveBeenCalledWith({ file, digest, confirmationId });
    expect(screen.getByRole("button", { name: "Отмена" })).toBeDisabled();
    pending.resolve(imported);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Создано модулей: 1, тем: 1, материалов: 4"),
    );
    expect(screen.queryByRole("link", { name: "Скачать шаблон YAML" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Скачать заполненный пример" })).not.toBeInTheDocument();
    expect(mocks.importPackage).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Вернуться к программе" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores a double click while import is pending", async () => {
    const pending = deferred<typeof imported>();
    mocks.importPackage.mockReturnValueOnce(pending.promise);
    openDialog();
    selectFile();
    await checkFile();
    const button = screen.getByRole("button", { name: "Импортировать 1 модулей" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.importPackage).toHaveBeenCalledTimes(1);
    pending.resolve(imported);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Импорт завершён"));
  });

  it("retries a lost response with the same file and confirmationId", async () => {
    mocks.importPackage.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(imported);
    openDialog();
    const file = selectFile();
    await checkFile();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать 1 модулей" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Повторить импорт" })).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent("Соединение потеряно");
    fireEvent.click(screen.getByRole("button", { name: "Повторить импорт" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Импорт завершён"));
    expect(mocks.importPackage).toHaveBeenCalledTimes(2);
    expect(mocks.importPackage.mock.calls[0][0]).toEqual({ file, digest, confirmationId });
    expect(mocks.importPackage.mock.calls[1][0]).toEqual({ file, digest, confirmationId });
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("resets preview and confirmation on file replacement", async () => {
    const replacementDigest = "b".repeat(64);
    const replacementConfirmationId = "123e4567-e89b-42d3-a456-426614174001";
    mocks.preview.mockResolvedValueOnce(preview).mockResolvedValueOnce({ ...preview, digest: replacementDigest });
    vi.mocked(crypto.randomUUID).mockReturnValueOnce(confirmationId).mockReturnValueOnce(replacementConfirmationId);
    mocks.importPackage.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    openDialog();
    const first = selectFile();
    await checkFile();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать 1 модулей" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Повторить импорт" })).toBeInTheDocument());
    const second = selectFile("replacement.yml");
    expect(screen.queryByText("Модулей: 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить импорт" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Проверить файл" })).toBeEnabled();
    await checkFile();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать 1 модулей" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Импорт завершён"));
    expect(mocks.preview.mock.calls.map(([file]) => file)).toEqual([first, second]);
    expect(mocks.importPackage.mock.calls[1][0]).toEqual({
      file: second,
      digest: replacementDigest,
      confirmationId: replacementConfirmationId,
    });
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["DIGEST_MISMATCH", "Файл изменился после проверки"],
    ["CONFIRMATION_CONFLICT", "подтверждение конфликтует"],
  ])("requires manual recheck after %s", async (code, message) => {
    mocks.importPackage.mockRejectedValueOnce(apiError(409, code));
    openDialog();
    selectFile();
    await checkFile();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать 1 модулей" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message));
    expect(screen.queryByRole("button", { name: "Повторить импорт" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Проверить файл" })).toBeEnabled();
    expect(mocks.importPackage).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, "Сессия завершилась"],
    [403, "Недостаточно прав"],
    [404, "Программа недоступна"],
    [413, "Файл слишком большой"],
    [500, "Сервер временно недоступен"],
    [503, "Сервер временно недоступен"],
  ])("shows a useful error for status %i", async (status, message) => {
    mocks.importPackage.mockRejectedValueOnce(apiError(status, "HTTP_ERROR"));
    openDialog();
    selectFile();
    await checkFile();
    fireEvent.click(screen.getByRole("button", { name: "Импортировать 1 модулей" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить импорт" }) !== null).toBe(status >= 500);
  });

  it("hides the action for a read-only program", () => {
    render(<ImportContentPackageDialog programId="program-1" editable={false} />);
    expect(screen.queryByRole("button", { name: "Импортировать модули" })).not.toBeInTheDocument();
  });
});
