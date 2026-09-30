"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import { useDuplicateLearningProgramMutation } from "../model/use-duplicate-learning-program-mutation";

export function DuplicateLearningProgramButton({ programId }: Readonly<{ programId: string }>) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const mutation = useDuplicateLearningProgramMutation();

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  const duplicate = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setError("");

    try {
      const created = await mutation.mutateAsync(programId);
      setOpen(false);
      router.push(`/teacher/programs/${created.slug}`);
    } catch {
      setError("Не удалось создать копию программы. Попробуйте ещё раз.");
    } finally {
      submitting.current = false;
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={mutation.isPending}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Copy size={16} aria-hidden="true" />
        Создать копию
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="duplicate-learning-program-title"
        aria-describedby="duplicate-learning-program-description"
        className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl"
        onClose={() => setOpen(false)}
        onCancel={(event) => {
          if (submitting.current) event.preventDefault();
        }}
      >
        <section className="space-y-5 p-6">
          <div>
            <h2 id="duplicate-learning-program-title" className="text-xl font-semibold">
              Создать копию программы?
            </h2>
            <p id="duplicate-learning-program-description" className="mt-2 text-sm text-neutral-600">
              Будет создан новый черновик со структурой, материалами и заданиями этой программы. Назначения учеников и
              их прогресс не копируются.
            </p>
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
            <Button type="button" disabled={mutation.isPending} onClick={() => void duplicate()}>
              {mutation.isPending ? "Создаём…" : "Создать копию"}
            </Button>
          </div>
        </section>
      </dialog>
    </>
  );
}
