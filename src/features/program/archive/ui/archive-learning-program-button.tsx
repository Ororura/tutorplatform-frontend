"use client";

import { useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useArchiveLearningProgramMutation } from "../api/archive-learning-program";

export function ArchiveLearningProgramButton({ programId }: Readonly<{ programId: string }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const mutation = useArchiveLearningProgramMutation();

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  const archive = async () => {
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync(programId);
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? "Программу нельзя архивировать в текущем состоянии. Обновите страницу."
          : "Не удалось архивировать программу.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Архивировать
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="archive-learning-program-title"
        className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <section className="space-y-5 p-6">
          <div>
            <h2 id="archive-learning-program-title" className="text-xl font-semibold">
              Архивировать программу?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">Программа останется доступной только для чтения.</p>
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
            <Button type="button" variant="danger" disabled={mutation.isPending} onClick={() => void archive()}>
              {mutation.isPending ? "Архивируем…" : "Архивировать"}
            </Button>
          </div>
        </section>
      </dialog>
    </>
  );
}
