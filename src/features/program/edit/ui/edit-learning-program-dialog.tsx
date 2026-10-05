"use client";
import { Input, Textarea } from "@/shared/ui/form-controls";

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
        className="dialog-surface w-[min(42rem,calc(100%-2rem))]"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="edit-learning-program-title" className="section-title">
                Редактировать программу
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">Предмет программы изменить нельзя.</p>
            </div>
            <button type="button" className="text-sm underline" onClick={close}>
              Закрыть
            </button>
          </div>
          <label className="block space-y-2">
            <span className="field-label">Название</span>
            <Input maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="field-label">Описание</span>
            <Textarea
              className="min-h-32 resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {error && (
            <p className="text-sm text-danger" role="alert">
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
