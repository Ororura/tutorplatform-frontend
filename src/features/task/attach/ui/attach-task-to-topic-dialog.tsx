"use client";
import { Input } from "@/shared/ui/form-controls";

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
          className="dialog-surface w-[min(48rem,calc(100%-2rem))]"
          onClose={close}
        >
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="attach-task-title" className="section-title">
                  Прикрепить задание
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">Доступны активные задания предмета этой программы.</p>
              </div>
              <button type="button" className="text-sm underline" onClick={close}>
                Закрыть
              </button>
            </div>

            <label className="block space-y-2">
              <span className="field-label">Поиск по названию</span>
              <Input
                aria-label="Поиск по названию"

                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground-muted">
              <Input checked={required} type="checkbox" onChange={(event) => setRequired(event.target.checked)} />
              Обязательное задание
            </label>

            {error && (
              <p
                className="rounded-surface border border-danger-border bg-danger-subtle p-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </p>
            )}

            {availableTasks.length === 0 ? (
              <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted">
                Подходящих заданий не найдено.
              </p>
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto rounded-surface border border-border divide-border">
                {availableTasks.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-sm text-foreground-muted">
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
