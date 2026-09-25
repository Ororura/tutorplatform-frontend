"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

const MAX_FILE_SIZE = 1_048_576;

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

export function ImportContentPackageDialog({ editable }: Readonly<{ programId: string; editable: boolean }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && editable && !dialogRef.current?.open) dialogRef.current?.showModal();
    if ((!open || !editable) && dialogRef.current?.open) dialogRef.current.close();
  }, [open, editable]);

  if (!editable) return null;

  const close = () => {
    setOpen(false);
    setFile(null);
    setError("");
  };

  const selectFile = (nextFile: File | null) => {
    setFile(nextFile);
    setError(nextFile ? fileError(nextFile) : "");
  };

  const checkFile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(fileError(file));
    // Preview API integration follows in the next milestone.
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
        className="m-auto w-[min(36rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={close}
      >
        <form className="space-y-5 p-6" onSubmit={checkFile} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id="import-content-package-title" className="text-xl font-semibold text-slate-950">
              Импорт учебных модулей
            </h2>
            <button type="button" className="text-sm underline" onClick={close}>
              Закрыть
            </button>
          </div>
          <p id="import-content-package-description" className="text-sm leading-6 text-slate-600">
            Загрузите YAML-файл, чтобы добавить готовые модули, темы и материалы в текущую программу.
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-950">{file ? "Заменить файл" : "Выберите YAML-файл"}</span>
            <input
              className="block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700"
              type="file"
              accept=".yaml,.yml"
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
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-950">Готового файла нет?</p>
            <p className="mt-1">Можно подготовить YAML самостоятельно или с помощью нейросети.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={close}>
              Отмена
            </Button>
            <Button type="submit">Проверить файл</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
