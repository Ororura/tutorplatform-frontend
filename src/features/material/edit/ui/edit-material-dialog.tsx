"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { type LessonMaterial, SafeMarkdown, topicMaterialQueries } from "@/entities/material";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useUpdateMaterialMutation } from "../api/update-material";

export type EditableMaterial = LessonMaterial & {
  materialType: "TEXT" | "MARKDOWN" | "CODE_EXAMPLE" | "LINK";
};
type Mode = "editor" | "preview";

const materialTypeLabels: Record<EditableMaterial["materialType"], string> = {
  TEXT: "Текст",
  MARKDOWN: "Markdown",
  CODE_EXAMPLE: "Пример кода",
  LINK: "Ссылка",
};

export function isEditableMaterial(material: LessonMaterial): material is EditableMaterial {
  return ["TEXT", "MARKDOWN", "CODE_EXAMPLE", "LINK"].includes(material.materialType);
}

export function EditMaterialDialog({ material }: Readonly<{ material: EditableMaterial }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const mutation = useUpdateMaterialMutation(material.topicId, material.id);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("editor");
  const [title, setTitle] = useState(material.title);
  const [value, setValue] = useState(
    material.materialType === "LINK" ? (material.externalUrl ?? "") : (material.content ?? ""),
  );
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  const showDialog = () => {
    setMode("editor");
    setTitle(material.title);
    setValue(material.materialType === "LINK" ? (material.externalUrl ?? "") : (material.content ?? ""));
    setError("");
    setConflict(false);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;

    if (!title.trim() || !value.trim()) {
      setError(material.materialType === "LINK" ? "Заполните название и URL." : "Заполните название и содержимое.");
      return;
    }

    setError("");
    setConflict(false);
    try {
      await mutation.mutateAsync({
        materialType: material.materialType,
        title: title.trim(),
        content: material.materialType === "LINK" ? null : value,
        externalUrl: material.materialType === "LINK" ? value.trim() : null,
        position: material.position,
        version: material.version,
      });
      setOpen(false);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 409) {
        setConflict(true);
        setError("Данные материала устарели. Обновите материал и повторите изменения.");
      } else if (caught instanceof ApiClientError && caught.status === 400) {
        setError("Проверьте данные материала.");
      } else {
        setError("Не удалось сохранить материал.");
      }
    }
  };

  const refreshMaterial = async () => {
    await queryClient.invalidateQueries({ queryKey: topicMaterialQueries.list(material.topicId).queryKey });
    setOpen(false);
  };

  const isMarkdown = material.materialType === "MARKDOWN";

  return (
    <>
      <Button type="button" variant="secondary" onClick={showDialog}>
        Редактировать
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`edit-material-title-${material.id}`}
        className="m-auto w-[min(48rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id={`edit-material-title-${material.id}`} className="text-xl font-semibold">
              Редактировать материал
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
            <input
              className="h-11 w-full rounded-md border bg-slate-50 px-3 text-slate-600"
              value={materialTypeLabels[material.materialType]}
              readOnly
            />
          </label>
          <div className="space-y-2">
            {isMarkdown && (
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
            {isMarkdown && mode === "preview" ? (
              <div className="min-h-64 rounded-md border p-3" role="tabpanel">
                {value ? (
                  <SafeMarkdown>{value}</SafeMarkdown>
                ) : (
                  <p className="text-sm text-slate-500">Предпросмотр пуст.</p>
                )}
              </div>
            ) : material.materialType === "LINK" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium">URL</span>
                <input
                  aria-label="URL"
                  className="h-11 w-full rounded-md border px-3"
                  type="url"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </label>
            ) : (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Содержимое</span>
                <textarea
                  aria-label={isMarkdown ? "Содержимое Markdown" : "Содержимое"}
                  className={`min-h-64 w-full resize-y rounded-md border p-3 text-sm ${material.materialType === "CODE_EXAMPLE" ? "font-mono" : ""}`}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </label>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            {conflict && (
              <Button type="button" variant="secondary" onClick={() => void refreshMaterial()}>
                Обновить материал
              </Button>
            )}
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
