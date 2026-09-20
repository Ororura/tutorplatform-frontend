"use client";

import { useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import {
  type LearningProgramTopic,
  useCreateLearningProgramTopicMutation,
  useUpdateLearningProgramTopicMutation,
} from "../api/manage-learning-program-topic";

const topicStatuses = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
type TopicStatus = (typeof topicStatuses)[number];

const topicStatusLabels: Record<TopicStatus, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активна",
  ARCHIVED: "В архиве",
};

type TopicFormProps = {
  title: string;
  description: string;
  status?: TopicStatus;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStatusChange?: (value: TopicStatus) => void;
};

function TopicForm({
  title,
  description,
  status,
  onTitleChange,
  onDescriptionChange,
  onStatusChange,
}: Readonly<TopicFormProps>) {
  return (
    <>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Название</span>
        <input
          className="h-11 w-full rounded-md border px-3"
          maxLength={180}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Описание</span>
        <textarea
          className="min-h-28 w-full resize-y rounded-md border p-3"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </label>
      {status && onStatusChange && (
        <label className="block space-y-2">
          <span className="text-sm font-medium">Статус</span>
          <select
            className="h-11 w-full rounded-md border bg-white px-3"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as TopicStatus)}
          >
            {topicStatuses.map((value) => (
              <option key={value} value={value}>
                {topicStatusLabels[value]}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}

function errorMessage(caught: unknown, action: "создать" | "изменить") {
  if (caught instanceof ApiClientError && caught.status === 409) {
    return "Тема больше не может быть изменена или была обновлена. Обновите страницу.";
  }
  return `Не удалось ${action} тему.`;
}

export function CreateLearningProgramTopicDialog({
  programId,
  moduleId,
  editable,
}: Readonly<{ programId: string; moduleId: string; editable: boolean }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const mutation = useCreateLearningProgramTopicMutation(programId, moduleId);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  if (!editable) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("Введите название темы.");
      return;
    }
    setError("");
    try {
      await mutation.mutateAsync({ title: normalizedTitle, description: description.trim() || null });
      setOpen(false);
      setTitle("");
      setDescription("");
    } catch (caught) {
      setError(errorMessage(caught, "создать"));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Добавить тему
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`create-topic-${moduleId}`}
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id={`create-topic-${moduleId}`} className="text-xl font-semibold">
              Добавить тему
            </h2>
            <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
          <TopicForm
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
          />
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Добавляем…" : "Добавить"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function LearningProgramTopicActions({
  programId,
  moduleId,
  topic,
  editable,
}: Readonly<{ programId: string; moduleId: string; topic: LearningProgramTopic; editable: boolean }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [description, setDescription] = useState(topic.description ?? "");
  const [status, setStatus] = useState<TopicStatus>(topic.status);
  const [error, setError] = useState("");
  const mutation = useUpdateLearningProgramTopicMutation(programId, moduleId, topic.id);

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  if (!editable) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("Введите название темы.");
      return;
    }
    setError("");
    try {
      await mutation.mutateAsync({
        title: normalizedTitle,
        description: description.trim() || null,
        status,
        version: topic.version,
      });
      setOpen(false);
    } catch (caught) {
      setError(errorMessage(caught, "изменить"));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-8 px-2"
        onClick={() => {
          setTitle(topic.title);
          setDescription(topic.description ?? "");
          setStatus(topic.status);
          setError("");
          setOpen(true);
        }}
      >
        Изменить
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`edit-topic-${topic.id}`}
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id={`edit-topic-${topic.id}`} className="text-xl font-semibold">
              Изменить тему
            </h2>
            <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
          <TopicForm
            title={title}
            description={description}
            status={status}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onStatusChange={setStatus}
          />
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
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
