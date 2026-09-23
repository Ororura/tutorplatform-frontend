"use client";

import { useEffect, useRef, useState } from "react";

import type { LessonMaterial } from "@/entities/material";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useDeleteMaterialMutation } from "../api/delete-material";

export function DeleteMaterialDialog({ material }: Readonly<{ material: LessonMaterial }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const mutation = useDeleteMaterialMutation(material.topicId);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  const confirmDeletion = async () => {
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync(material.id);
      setOpen(false);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 404) {
        setError("Материал уже удалён или недоступен. Обновите страницу.");
      } else {
        setError("Не удалось удалить материал. Попробуйте ещё раз.");
      }
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        aria-label={`Удалить «${material.title}»`}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Удалить
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-material-title-${material.id}`}
        aria-describedby={`delete-material-description-${material.id}`}
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onCancel={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-5 p-6">
          <h2 id={`delete-material-title-${material.id}`} className="text-xl font-semibold text-slate-950">
            Удалить материал
          </h2>
          <p id={`delete-material-description-${material.id}`} className="break-words text-sm text-slate-700">
            Вы действительно хотите удалить «{material.title}»? Это действие нельзя отменить.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" variant="danger" disabled={mutation.isPending} onClick={() => void confirmDeletion()}>
              {mutation.isPending ? "Удаляем…" : "Удалить материал"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
