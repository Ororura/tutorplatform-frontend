"use client";

import { useEffect, useRef, useState } from "react";

import type { LessonMaterial } from "@/entities/material";
import { MaterialRenderer } from "@/entities/material";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateMaterialMutation } from "../api/create-material";

type Mode = "editor" | "preview";
type CreateMaterialType = "TEXT" | "MARKDOWN" | "CODE_EXAMPLE" | "LINK";

function isExternalUrl(value: string): boolean {
  try {
    const protocol = new URL(value.trim()).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function CreateMarkdownMaterialDialog({
  topicId,
  position,
  editable,
}: Readonly<{ topicId: string; position: number; editable: boolean }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("editor");
  const [materialType, setMaterialType] = useState<CreateMaterialType>("MARKDOWN");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const mutation = useCreateMaterialMutation(topicId);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  if (!editable) return null;

  const reset = () => {
    setMode("editor");
    setMaterialType("MARKDOWN");
    setTitle("");
    setValue("");
    setError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;

    if (!title.trim() || !value.trim()) {
      setError(materialType === "LINK" ? "Заполните название и URL." : "Заполните название и содержимое материала.");
      return;
    }
    if (materialType === "LINK" && !isExternalUrl(value)) {
      setError("Укажите ссылку, начинающуюся с http:// или https://.");
      return;
    }

    setError("");
    try {
      await mutation.mutateAsync({
        materialType,
        title: title.trim(),
        content: materialType === "LINK" ? null : value,
        externalUrl: materialType === "LINK" ? value.trim() : null,
        position,
      });
      reset();
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 400
          ? "Проверьте данные материала."
          : "Не удалось создать материал.",
      );
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Добавить материал
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-material-title"
        className="m-auto w-[min(48rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id="create-material-title" className="text-xl font-semibold">
              Добавить материал
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
              aria-label="Тип материала"
              className="h-11 w-full rounded-md border px-3"
              value={materialType}
              onChange={(event) => {
                setMaterialType(event.target.value as CreateMaterialType);
                setMode("editor");
                setError("");
              }}
            >
              <option value="TEXT">Текст</option>
              <option value="MARKDOWN">Markdown</option>
              <option value="CODE_EXAMPLE">Пример кода</option>
              <option value="LINK">Ссылка</option>
            </select>
          </label>
          <div className="space-y-2">
            {materialType !== "LINK" && (
              <div className="flex gap-2" role="tablist" aria-label="Режим материала">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "editor"}
                  className={`rounded-md px-3 py-2 text-sm ${mode === "editor" ? "bg-slate-100 font-medium" : "underline"}`}
                  onClick={() => setMode("editor")}
                >
                  Редактор
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "preview"}
                  className={`rounded-md px-3 py-2 text-sm ${mode === "preview" ? "bg-slate-100 font-medium" : "underline"}`}
                  onClick={() => setMode("preview")}
                >
                  Предпросмотр
                </button>
              </div>
            )}
            {mode === "editor" ? (
              materialType === "LINK" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Ссылка</span>
                  <input
                    aria-label="Ссылка"
                    className="h-11 w-full rounded-md border px-3"
                    type="url"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </label>
              ) : (
                <textarea
                  aria-label={
                    materialType === "TEXT"
                      ? "Содержимое текста"
                      : materialType === "MARKDOWN"
                        ? "Содержимое Markdown"
                        : "Содержимое кода"
                  }
                  className={`min-h-64 w-full resize-y rounded-md border p-3 text-sm ${materialType === "CODE_EXAMPLE" ? "font-mono" : ""}`}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              )
            ) : (
              <div className="min-h-64 rounded-md border p-3" role="tabpanel">
                {value ? (
                  <MaterialRenderer
                    material={
                      {
                        id: "draft",
                        topicId,
                        materialType,
                        title: title || "Без названия",
                        content: materialType === "LINK" ? null : value,
                        externalUrl: materialType === "LINK" ? value : null,
                        position,
                        version: 0,
                        createdAt: "",
                        updatedAt: "",
                      } as LessonMaterial
                    }
                  />
                ) : (
                  <p className="text-sm text-slate-500">Предпросмотр пуст.</p>
                )}
              </div>
            )}
            {materialType === "LINK" && isExternalUrl(value) && (
              <a
                className="block break-all text-sm text-blue-700 underline"
                href={value.trim()}
                rel="noopener noreferrer"
                target="_blank"
              >
                {value.trim()}
              </a>
            )}
          </div>
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
              {mutation.isPending ? "Добавляем…" : "Добавить"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
