"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { type Task, taskDifficultyPresentation, taskTypePresentation, type TopicTask } from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useAttachTaskToTopicMutation } from "../api/attach-task-to-topic";

function attachmentError(error: unknown): string {
  if (!(error instanceof ApiClientError)) return "Не удалось прикрепить задание.";
  if (error.status === 404) return "Тема недоступна или задание не найдено.";
  if (error.body.code === "TASK_SUBJECT_MISMATCH") return "Задание должно относиться к предмету этой программы.";
  if (error.status === 409) return "Задание уже прикреплено или позиция занята. Обновите список и повторите попытку.";
  return "Не удалось прикрепить задание.";
}

export function AttachTaskToTopicDialog({
  topicId,
  tasks,
  attachedTasks,
}: Readonly<{
  topicId: string;
  tasks: Task[];
  attachedTasks: TopicTask[];
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [required, setRequired] = useState(true);
  const [error, setError] = useState("");
  const mutation = useAttachTaskToTopicMutation(topicId);
  const attachedIds = useMemo(() => new Set(attachedTasks.map((task) => task.taskId)), [attachedTasks]);
  const availableTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !attachedIds.has(task.id) && task.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [attachedIds, query, tasks],
  );
  const position = Math.max(-1, ...attachedTasks.map((task) => task.position)) + 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setRequired(true);
    setError("");
    queueMicrotask(() => triggerRef.current?.focus());
  }

  async function attach(taskId: string) {
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync({ taskId, position, required });
      close();
    } catch (caught) {
      setError(attachmentError(caught));
    }
  }

  return (
    <>
      <Button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Прикрепить задание
      </Button>
      {open && (
        <dialog
          ref={dialogRef}
          aria-labelledby="attach-task-title"
          className="m-auto w-[min(48rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
          onClose={close}
        >
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="attach-task-title" className="text-xl font-semibold text-slate-950">
                  Прикрепить задание
                </h2>
                <p className="mt-1 text-sm text-slate-500">Доступны активные задания предмета этой программы.</p>
              </div>
              <button type="button" className="text-sm underline" onClick={close}>
                Закрыть
              </button>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Поиск по названию</span>
              <input
                aria-label="Поиск по названию"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input checked={required} type="checkbox" onChange={(event) => setRequired(event.target.checked)} />
              Обязательное задание
            </label>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            {availableTasks.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Подходящих заданий не найдено.</p>
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border border-slate-100">
                {availableTasks.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {taskTypePresentation[task.taskType]} · {taskDifficultyPresentation[task.difficulty]}
                      </p>
                    </div>
                    <Button
                      disabled={mutation.isPending}
                      type="button"
                      variant="secondary"
                      onClick={() => void attach(task.id)}
                    >
                      Выбрать
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
