"use client";

import { useEffect, useRef, useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import {
  type LearningProgramModule,
  useCreateLearningProgramModuleMutation,
  useDeleteLearningProgramModuleMutation,
  useUpdateLearningProgramModuleMutation,
} from "../api/manage-learning-program-module";

type ModuleFormProps = {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

function ModuleForm({ title, description, onTitleChange, onDescriptionChange }: Readonly<ModuleFormProps>) {
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
    </>
  );
}

function errorMessage(caught: unknown, action: "создать" | "изменить" | "удалить") {
  if (caught instanceof ApiClientError && caught.status === 409) {
    return "Модуль больше нельзя изменить. Обновите страницу.";
  }
  return `Не удалось ${action} модуль.`;
}

export function CreateLearningProgramModuleDialog({
  programId,
  editable,
  onCreated,
}: Readonly<{ programId: string; editable: boolean; onCreated: (moduleId: string) => void }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const mutation = useCreateLearningProgramModuleMutation(programId);

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
      setError("Введите название модуля.");
      return;
    }
    setError("");
    try {
      const createdModule = await mutation.mutateAsync({
        title: normalizedTitle,
        description: description.trim() || null,
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      onCreated(createdModule.id);
    } catch (caught) {
      setError(errorMessage(caught, "создать"));
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Добавить модуль
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-learning-program-module-title"
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id="create-learning-program-module-title" className="text-xl font-semibold">
              Добавить модуль
            </h2>
            <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
          <ModuleForm
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

export function LearningProgramModuleActions({
  programId,
  module,
  editable,
}: Readonly<{ programId: string; module: LearningProgramModule; editable: boolean }>) {
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description ?? "");
  const [error, setError] = useState("");
  const update = useUpdateLearningProgramModuleMutation(programId, module.id);
  const remove = useDeleteLearningProgramModuleMutation(programId, module.id);

  useEffect(() => {
    if (editing && !editDialogRef.current?.open) editDialogRef.current?.showModal();
    if (!editing && editDialogRef.current?.open) editDialogRef.current.close();
  }, [editing]);
  useEffect(() => {
    if (deleting && !deleteDialogRef.current?.open) deleteDialogRef.current?.showModal();
    if (!deleting && deleteDialogRef.current?.open) deleteDialogRef.current.close();
  }, [deleting]);

  if (!editable) return null;

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (update.isPending) return;
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setError("Введите название модуля.");
      return;
    }
    setError("");
    try {
      await update.mutateAsync({ title: normalizedTitle, description: description.trim() || null });
      setEditing(false);
    } catch (caught) {
      setError(errorMessage(caught, "изменить"));
    }
  };

  const confirmDelete = async () => {
    if (remove.isPending) return;
    setError("");
    try {
      await remove.mutateAsync();
      setDeleting(false);
    } catch (caught) {
      setError(errorMessage(caught, "удалить"));
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setTitle(module.title);
            setDescription(module.description ?? "");
            setError("");
            setEditing(true);
          }}
        >
          Изменить
        </Button>
        {module.topics.length === 0 && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setError("");
              setDeleting(true);
            }}
          >
            Удалить
          </Button>
        )}
      </div>
      <dialog
        ref={editDialogRef}
        aria-labelledby={`edit-module-${module.id}`}
        className="m-auto w-[min(42rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setEditing(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submitEdit} noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 id={`edit-module-${module.id}`} className="text-xl font-semibold">
              Изменить модуль
            </h2>
            <button type="button" className="text-sm underline" onClick={() => setEditing(false)}>
              Закрыть
            </button>
          </div>
          <ModuleForm
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
            <Button type="button" variant="secondary" disabled={update.isPending} onClick={() => setEditing(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </dialog>
      <dialog
        ref={deleteDialogRef}
        aria-labelledby={`delete-module-${module.id}`}
        className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
        onClose={() => setDeleting(false)}
      >
        <section className="space-y-5 p-6">
          <div>
            <h2 id={`delete-module-${module.id}`} className="text-xl font-semibold">
              Удалить модуль?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Модуль «{module.title}» будет удалён без возможности восстановления.
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={remove.isPending} onClick={() => setDeleting(false)}>
              Отмена
            </Button>
            <Button type="button" variant="danger" disabled={remove.isPending} onClick={() => void confirmDelete()}>
              {remove.isPending ? "Удаляем…" : "Удалить"}
            </Button>
          </div>
        </section>
      </dialog>
    </>
  );
}
