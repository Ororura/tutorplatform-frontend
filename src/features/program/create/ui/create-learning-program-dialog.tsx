"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { taskQueries } from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateLearningProgramMutation } from "../api/create-learning-program";

export function CreateLearningProgramDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const subjects = useQuery({
    ...taskQueries.subjects(),
    enabled: open,
  });

  const mutation = useCreateLearningProgramMutation();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  const reset = () => {
    setSubjectId("");
    setTitle("");
    setDescription("");
    setError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mutation.isPending) return;

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!subjectId) {
      setError("Выберите предмет.");
      return;
    }

    if (!normalizedTitle) {
      setError("Введите название программы.");
      return;
    }

    setError("");

    try {
      await mutation.mutateAsync({
        subjectId,
        title: normalizedTitle,
        ...(normalizedDescription
          ? {
              description: normalizedDescription,
            }
          : {}),
      });

      reset();
      close();
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        if (caught.status === 400) {
          setError("Проверьте введённые данные.");
          return;
        }

        if (caught.status === 404) {
          setError("Выбранный предмет больше недоступен.");
          await subjects.refetch();
          return;
        }
      }

      setError("Не удалось создать программу. Попробуйте ещё раз.");
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Создать программу
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="create-learning-program-title"
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="create-learning-program-title" className="text-xl font-semibold">
                Создать программу
              </h2>

              <p className="mt-1 text-sm text-neutral-600">Новая программа будет создана как черновик.</p>
            </div>

            <button
              type="button"
              className="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
              onClick={close}
            >
              Закрыть
            </button>
          </div>

          {subjects.isPending && (
            <p className="text-sm text-neutral-600" aria-busy="true">
              Загружаем предметы…
            </p>
          )}

          {subjects.isError && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
              <p>Не удалось загрузить предметы.</p>

              <Button type="button" onClick={() => void subjects.refetch()}>
                Повторить
              </Button>
            </div>
          )}

          {!subjects.isPending && !subjects.isError && (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Предмет</span>

                <select
                  aria-label="Предмет"
                  className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3"
                  value={subjectId}
                  onChange={(event) => {
                    setSubjectId(event.target.value);
                    setError("");
                  }}
                >
                  <option value="">Выберите предмет</option>

                  {subjects.data
                    ?.filter((subject) => subject.status === "ACTIVE")
                    .map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Название</span>

                <input
                  className="h-11 w-full rounded-md border border-neutral-300 px-3"
                  maxLength={200}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError("");
                  }}
                  placeholder="Например, Python с нуля"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">
                  Описание
                  <span className="ml-1 font-normal text-neutral-500">(необязательно)</span>
                </span>

                <textarea
                  className="min-h-32 w-full resize-y rounded-md border border-neutral-300 p-3"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Для кого программа и чему она посвящена"
                />
              </label>
            </>
          )}

          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-medium"
              disabled={mutation.isPending}
              onClick={close}
            >
              Отмена
            </button>

            <Button type="submit" disabled={mutation.isPending || subjects.isPending || subjects.isError}>
              {mutation.isPending ? "Создаём…" : "Создать"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
