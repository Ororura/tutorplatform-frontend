"use client";

import { useEffect, useRef, useState } from "react";

import { MaterialRenderer } from "@/entities/material";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useImportContentPackageMutation } from "../api/import-content-package";
import { usePreviewContentPackageMutation } from "../api/preview-content-package";
import {
  ContentPackagePreviewValidationError,
  type ContentPackageImportResponse,
  type ContentPackagePreviewError,
  type ContentPackagePreviewResponse,
} from "../model/content-package";
import { formatContentPackageError, serializeContentPackageErrors } from "../model/format-content-package-error";
import { ContentPackagePromptDialog } from "./content-package-prompt-dialog";

const MAX_FILE_SIZE = 1_048_576;
type Preview = ContentPackagePreviewResponse & { valid: true; digest: string };
type Flow =
  | { phase: "SELECT_FILE"; file: File | null; error?: string }
  | { phase: "PREVIEW_LOADING"; file: File }
  | { phase: "PREVIEW_READY"; file: File; preview: Preview }
  | { phase: "IMPORT_LOADING"; file: File; preview: Preview; confirmationId: string }
  | { phase: "IMPORT_SUCCESS"; result: ContentPackageImportResponse }
  | { phase: "ERROR"; file: File; error: Error; preview?: Preview; confirmationId?: string };

function fileError(file: File | null): string {
  if (!file) return "Выберите YAML-файл.";
  if (!/\.(yaml|yml)$/i.test(file.name)) return "Поддерживаются только файлы .yaml и .yml.";
  if (file.size > MAX_FILE_SIZE) return "Размер файла не должен превышать 1 МиБ.";
  return "";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  return `${(bytes / 1024).toFixed(1)} КиБ`;
}

function errorMessage(error: Error): string {
  if (error instanceof ApiClientError) {
    if (error.body.code === "DIGEST_MISMATCH") return "Файл изменился после проверки. Проверьте его повторно.";
    if (error.body.code === "CONFIRMATION_CONFLICT")
      return "Это подтверждение конфликтует с предыдущим импортом. Проверьте файл повторно перед новым подтверждением.";
    switch (error.status) {
      case 400:
        return "Файл содержит ошибки. Исправьте его и проверьте повторно.";
      case 401:
        return "Сессия завершилась. Войдите снова, чтобы продолжить импорт.";
      case 403:
        return "Недостаточно прав для импорта в эту программу.";
      case 404:
        return "Программа недоступна или была удалена.";
      case 413:
        return "Файл слишком большой. Максимальный размер — 1 МиБ.";
      case 500:
      case 503:
        return "Сервер временно недоступен. Повторите запрос.";
      default:
        return error.body.message;
    }
  }
  if (error instanceof ContentPackagePreviewValidationError)
    return "Файл содержит ошибки. Исправьте их и проверьте повторно.";
  return "Соединение потеряно. Проверьте сеть и повторите запрос.";
}

function canRetryImport(error: Error): boolean {
  return (
    !(error instanceof ContentPackagePreviewValidationError) &&
    (!(error instanceof ApiClientError) || error.status >= 500)
  );
}

function PreviewTree({ preview }: Readonly<{ preview: Preview }>) {
  return (
    <section className="space-y-4" aria-label="Предварительный просмотр модулей">
      <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
        <span>Модулей: {preview.moduleCount ?? 0}</span>
        <span>Тем: {preview.topicCount ?? 0}</span>
        <span>Материалов: {preview.materialCount ?? 0}</span>
      </div>
      <ol className="space-y-4">
        {preview.modules?.map((module, moduleIndex) => (
          <li key={moduleIndex} className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">{module.title}</h3>
            {module.description && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{module.description}</p>
            )}
            <ol className="mt-3 space-y-3 border-l-2 border-blue-100 pl-4">
              {module.topics?.map((topic, topicIndex) => (
                <li key={topicIndex}>
                  <h4 className="font-medium text-slate-900">{topic.title}</h4>
                  <ol className="mt-2 space-y-2">
                    {topic.materials?.map((material, materialIndex) => (
                      <li key={materialIndex} className="rounded-md bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-900">{material.title}</p>
                        <p className="mb-2 text-xs text-slate-500">{material.materialType}</p>
                        {material.materialType && (
                          <MaterialRenderer
                            preview
                            material={{
                              title: material.title ?? "",
                              materialType: material.materialType,
                              content: material.content,
                              externalUrl: material.externalUrl,
                            }}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ImportContentPackageDialog({
  programId,
  editable,
}: Readonly<{ programId: string; editable: boolean }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [flow, setFlow] = useState<Flow>({ phase: "SELECT_FILE", file: null });
  const previewMutation = usePreviewContentPackageMutation(programId);
  const importMutation = useImportContentPackageMutation(programId);
  const busy = flow.phase === "PREVIEW_LOADING" || flow.phase === "IMPORT_LOADING";
  const file = flow.phase === "IMPORT_SUCCESS" ? null : flow.file;
  const preview = "preview" in flow ? flow.preview : undefined;
  const retryImport = flow.phase === "ERROR" && !!flow.preview && !!flow.confirmationId && canRetryImport(flow.error);
  const validationErrors: ContentPackagePreviewError[] =
    flow.phase !== "ERROR"
      ? []
      : flow.error instanceof ContentPackagePreviewValidationError
        ? flow.error.errors
        : flow.error instanceof ApiClientError
          ? [
              {
                code: flow.error.body.code,
                path: flow.error.body.details[0]?.field ?? "",
                message: flow.error.body.message,
              },
            ]
          : [];

  useEffect(() => {
    if (open && editable && !dialogRef.current?.open) dialogRef.current?.showModal();
    if ((!open || !editable) && dialogRef.current?.open) dialogRef.current.close();
  }, [open, editable]);

  if (!editable) return null;

  const close = () => {
    if (busyRef.current) return;
    setOpen(false);
    setPromptOpen(false);
    setCopyStatus("");
    setFlow({ phase: "SELECT_FILE", file: null });
  };

  const selectFile = (nextFile: File | null) => {
    if (busyRef.current) return;
    setCopyStatus("");
    setFlow({ phase: "SELECT_FILE", file: nextFile, error: nextFile ? fileError(nextFile) : undefined });
  };

  const checkFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (flow.phase === "IMPORT_SUCCESS" || preview) return;
    if (busyRef.current || !file) {
      if (!file) setFlow({ phase: "SELECT_FILE", file: null, error: fileError(null) });
      return;
    }
    const error = fileError(file);
    if (error) {
      setFlow({ phase: "SELECT_FILE", file, error });
      return;
    }
    busyRef.current = true;
    setFlow({ phase: "PREVIEW_LOADING", file });
    try {
      const result = await previewMutation.mutateAsync(file);
      if (!result.valid || !result.digest) {
        throw new ContentPackagePreviewValidationError(400, result.errors ?? []);
      }
      setFlow({ phase: "PREVIEW_READY", file, preview: result as Preview });
    } catch (cause) {
      setFlow({ phase: "ERROR", file, error: cause instanceof Error ? cause : new Error("Preview failed") });
    } finally {
      busyRef.current = false;
    }
  };

  const confirmImport = async () => {
    if (busyRef.current || !preview || !file) return;
    if (flow.phase !== "PREVIEW_READY" && !retryImport) return;
    const confirmationId = flow.phase === "ERROR" ? flow.confirmationId! : crypto.randomUUID();
    busyRef.current = true;
    setFlow({ phase: "IMPORT_LOADING", file, preview, confirmationId });
    try {
      const result = await importMutation.mutateAsync({ file, digest: preview.digest, confirmationId });
      setFlow({ phase: "IMPORT_SUCCESS", result });
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error("Import failed");
      setFlow({
        phase: "ERROR",
        file,
        ...(canRetryImport(error) ? { preview, confirmationId } : {}),
        error,
      });
    } finally {
      busyRef.current = false;
    }
  };

  const copyErrors = async () => {
    const details = flow.phase === "ERROR" && flow.error instanceof ApiClientError ? flow.error.body.details : [];
    const text =
      serializeContentPackageErrors(validationErrors) +
      details.map((detail) => `\nfield: ${detail.field}\nmessage: ${detail.message}`).join("");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Ошибки скопированы.");
    } catch {
      setCopyStatus("Не удалось скопировать ошибки. Выделите текст в технических подробностях вручную.");
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Импортировать модули
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="import-content-package-title"
        aria-describedby="import-content-package-description"
        className="m-auto max-h-[min(90vh,50rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onCancel={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
        onClose={close}
      >
        <form className="space-y-5 p-6" onSubmit={(event) => void checkFile(event)} noValidate aria-busy={busy}>
          <div className="flex items-start justify-between gap-4">
            <h2 id="import-content-package-title" className="text-xl font-semibold text-slate-950">
              Импорт учебных модулей
            </h2>
            <button type="button" className="text-sm underline" onClick={close} disabled={busy}>
              Закрыть
            </button>
          </div>
          {flow.phase === "IMPORT_SUCCESS" ? (
            <>
              <p className="text-sm text-emerald-700" role="status">
                Импорт завершён. Создано модулей: {flow.result.moduleCount ?? 0}, тем: {flow.result.topicCount ?? 0},
                материалов: {flow.result.materialCount ?? 0}.
              </p>
              <div className="flex justify-end">
                <Button type="button" onClick={close}>
                  Вернуться к программе
                </Button>
              </div>
            </>
          ) : (
            <>
              <p id="import-content-package-description" className="text-sm leading-6 text-slate-600">
                Загрузите YAML-файл, чтобы добавить готовые модули, темы и материалы в текущую программу.
              </p>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setPromptOpen(true)}>
                Создать с помощью нейросети
              </Button>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-950">
                  {file ? "Заменить файл" : "Выберите YAML-файл"}
                </span>
                <input
                  className="block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700"
                  type="file"
                  accept=".yaml,.yml"
                  disabled={busy}
                  onChange={(event) => {
                    selectFile(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
              </label>
              {file && (
                <p className="text-sm text-slate-600">
                  {file.name} · {formatFileSize(file.size)}
                </p>
              )}
              {flow.phase === "SELECT_FILE" && flow.error && (
                <p className="text-sm text-red-700" role="alert">
                  {flow.error}
                </p>
              )}
              {flow.phase === "ERROR" && (
                <div className="space-y-3 text-sm">
                  <div className="space-y-2 text-red-700" role="alert">
                    <p>{errorMessage(flow.error)}</p>
                    {validationErrors.length > 0 && (
                      <ul className="list-inside list-disc">
                        {validationErrors.map((item, index) => (
                          <li key={index}>{formatContentPackageError(item, preview)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {validationErrors.length > 0 && (
                    <>
                      <details className="rounded-md border border-slate-200 p-3 text-slate-700">
                        <summary className="cursor-pointer font-medium">Технические подробности</summary>
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap select-text">
                          {serializeContentPackageErrors(validationErrors)}
                        </pre>
                        {flow.error instanceof ApiClientError &&
                          flow.error.body.details.map((detail, index) => (
                            <p key={index}>
                              field: {detail.field}; message: {detail.message}
                            </p>
                          ))}
                      </details>
                      <Button type="button" variant="secondary" onClick={() => void copyErrors()}>
                        Скопировать ошибки
                      </Button>
                      {copyStatus && (
                        <p role="status" className="text-slate-700">
                          {copyStatus}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              {flow.phase === "PREVIEW_LOADING" && <p role="status">Проверяем файл…</p>}
              {flow.phase === "IMPORT_LOADING" && <p role="status">Импортируем модули…</p>}
              {preview && <PreviewTree preview={preview} />}
              {!preview && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-950">Готового файла нет?</p>
                  <p className="mt-1">
                    Шаблон содержит структуру модулей, тем и материалов. Замените примерное содержимое своим и загрузите
                    файл обратно.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    <a
                      className="font-medium text-blue-700 underline"
                      href="/templates/tutor-content-package.yaml"
                      download
                    >
                      Скачать шаблон YAML
                    </a>
                    <a
                      className="font-medium text-blue-700 underline"
                      href="/templates/python-conditions.yaml"
                      download
                    >
                      Скачать заполненный пример
                    </a>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={close} disabled={busy}>
                  Отмена
                </Button>
                {!preview && (
                  <Button type="submit" disabled={busy}>
                    Проверить файл
                  </Button>
                )}
                {(flow.phase === "PREVIEW_READY" || retryImport) && (
                  <Button type="button" disabled={busy} onClick={() => void confirmImport()}>
                    {retryImport ? "Повторить импорт" : `Импортировать ${preview?.moduleCount ?? 0} модулей`}
                  </Button>
                )}
              </div>
            </>
          )}
        </form>
      </dialog>
      {promptOpen && <ContentPackagePromptDialog onClose={() => setPromptOpen(false)} />}
    </>
  );
}
