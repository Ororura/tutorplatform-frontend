"use client";

/* eslint-disable @next/next/no-img-element -- Object URLs are local draft previews. */

import { useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useUploadMaterialMutation, type UploadMaterialRequest } from "../api/upload-material";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FILE_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "text/plain"]);
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

type UploadMaterialType = UploadMaterialRequest["materialType"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КиБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МиБ`;
}

function fileError(file: File, materialType: UploadMaterialType): string | null {
  if (file.size > MAX_FILE_SIZE) return "Размер файла не должен превышать 10 МиБ.";
  if (!FILE_MIME_TYPES.has(file.type)) return "Разрешены только PDF, PNG, JPEG и текстовые файлы.";
  if (materialType === "IMAGE" && !IMAGE_MIME_TYPES.has(file.type)) {
    return "Для изображения разрешены только PNG и JPEG.";
  }
  return null;
}

export function UploadMaterialDialog({
  topicId,
  position,
  editable,
}: Readonly<{ topicId: string; position: number; editable: boolean }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState<UploadMaterialType>("FILE");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mutation = useUploadMaterialMutation(topicId);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  if (!editable) return null;

  const reset = () => {
    setTitle("");
    setMaterialType("FILE");
    setFile(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setError("");
  };

  const selectFile = (nextFile: File | null) => {
    setFile(nextFile);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreviewUrl = nextFile && IMAGE_MIME_TYPES.has(nextFile.type) ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setError(nextFile ? (fileError(nextFile, materialType) ?? "") : "");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;

    if (!title.trim() || !file) {
      setError("Укажите название и выберите файл.");
      return;
    }
    const validationError = fileError(file, materialType);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    try {
      await mutation.mutateAsync({ materialType, title: title.trim(), position, file });
      reset();
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 413
          ? "Размер файла не должен превышать 10 МиБ."
          : "Не удалось загрузить файл. Проверьте данные и повторите попытку.",
      );
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Загрузить файл
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="upload-material-title"
        className="m-auto w-[min(36rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id="upload-material-title" className="text-xl font-semibold">
              Загрузить материал
            </h2>
            <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Название</span>
            <input
              className="h-11 w-full rounded-md border px-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Тип материала</span>
            <select
              aria-label="Тип файла"
              className="h-11 w-full rounded-md border px-3"
              value={materialType}
              onChange={(event) => {
                const nextType = event.target.value as UploadMaterialType;
                setMaterialType(nextType);
                setError(file ? (fileError(file, nextType) ?? "") : "");
              }}
            >
              <option value="FILE">Файл</option>
              <option value="IMAGE">Изображение</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Файл</span>
            <input
              aria-label="Выберите файл"
              type="file"
              accept="application/pdf,image/png,image/jpeg,text/plain"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <p className="text-sm text-slate-600">
              {file.name} · {formatFileSize(file.size)}
            </p>
          )}
          {previewUrl && materialType === "IMAGE" && (
            <img
              className="max-h-64 rounded-md border object-contain"
              src={previewUrl}
              alt="Предпросмотр выбранного изображения"
            />
          )}
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Загружаем…" : "Загрузить"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
