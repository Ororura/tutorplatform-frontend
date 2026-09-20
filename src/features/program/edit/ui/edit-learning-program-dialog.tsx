"use client";

import { useEffect, useRef, useState } from "react";

import { type LearningProgramDetails } from "@/entities/learning-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useUpdateLearningProgramMutation } from "../api/update-learning-program";

export function EditLearningProgramDialog({ program }: Readonly<{ program: LearningProgramDetails }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(program.title);
  const [description, setDescription] = useState(program.description ?? "");
  const [error, setError] = useState("");
  const mutation = useUpdateLearningProgramMutation(program.id);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  const close = () => setOpen(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    if (!normalizedTitle) {
      setError("Введите название программы.");
      return;
    }

    setError("");
    try {
      await mutation.mutateAsync({
        title: normalizedTitle,
        description: normalizedDescription || null,
        version: program.version,
      });
      close();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? "Программа уже изменена или больше недоступна для редактирования. Обновите страницу."
          : "Не удалось обновить программу.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setTitle(program.title);
          setDescription(program.description ?? "");
          setError("");
          setOpen(true);
        }}
      >
        Редактировать
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="edit-learning-program-title"
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="edit-learning-program-title" className="text-xl font-semibold">
                Редактировать программу
              </h2>
              <p className="mt-1 text-sm text-neutral-600">Предмет программы изменить нельзя.</p>
            </div>
            <button type="button" className="text-sm underline" onClick={close}>
              Закрыть
            </button>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Название</span>
            <input
              className="h-11 w-full rounded-md border px-3"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Описание</span>
            <textarea
              className="min-h-32 w-full resize-y rounded-md border p-3"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={close}>
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
