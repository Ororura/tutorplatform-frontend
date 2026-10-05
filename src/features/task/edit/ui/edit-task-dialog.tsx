"use client";
import { Input, Select, Textarea } from "@/shared/ui/form-controls";

import { useEffect, useRef, useState } from "react";

import {
  type Task,
  type TaskDifficulty,
  taskDifficultyPresentation,
  type TaskStatus,
  taskStatusPresentation,
} from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useUpdateTaskMutation } from "../api/update-task";

export function EditTaskDialog({ task }: Readonly<{ task: Task }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.descriptionMarkdown);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task.difficulty);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [error, setError] = useState("");
  const mutation = useUpdateTaskMutation(task.id);
  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!title.trim() || !description.trim()) {
      setError("Заполните название и описание.");
      return;
    }
    try {
      await mutation.mutateAsync({
        title: title.trim(),
        descriptionMarkdown: description.trim(),
        difficulty,
        status,
        version: task.version,
      });
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? "Задание уже изменено. Обновите страницу."
          : "Не удалось обновить задание.",
      );
    }
  };
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Редактировать
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="edit-task-title"
        className="dialog-surface w-[min(42rem,calc(100%-2rem))]"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit}>
          <div className="flex justify-between">
            <h2 id="edit-task-title" className="section-title">
              Редактировать задание
            </h2>
            <button className="text-sm underline" type="button" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
          <label className="block space-y-2">
            <span className="field-label">Название</span>
            <Input maxLength={220} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="field-label">Описание Markdown</span>
            <Textarea
              className="min-h-36"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="field-label">Сложность</span>
              <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)}>
                {(Object.keys(taskDifficultyPresentation) as TaskDifficulty[]).map((value) => (
                  <option key={value} value={value}>
                    {taskDifficultyPresentation[value]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="field-label">Статус</span>
              <Select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                {(Object.keys(taskStatusPresentation) as TaskStatus[]).map((value) => (
                  <option key={value} value={value}>
                    {taskStatusPresentation[value]}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </form>
      </dialog>
    </>
  );
}
