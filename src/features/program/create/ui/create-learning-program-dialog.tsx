"use client";
import { Input, Select, Textarea } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { type ComponentProps, useState } from "react";

import { taskQueries } from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

import { useCreateLearningProgramMutation } from "../api/create-learning-program";

type Props = {
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function CreateLearningProgramDialog({ triggerVariant = "primary" }: Readonly<Props>) {
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

  const close = () => setOpen(false);

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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          type="button"
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          Создать программу
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl" showCloseButton={!mutation.isPending}>
        <form className="space-y-5" onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Создать программу</DialogTitle>
            <DialogDescription>Новая программа будет создана как черновик.</DialogDescription>
          </DialogHeader>

          {subjects.isPending && (
            <p className="text-sm text-foreground-muted" aria-busy="true">
              Загружаем предметы…
            </p>
          )}

          {subjects.isError && (
            <div className="space-y-3 rounded-inset border border-danger-border bg-danger-subtle p-4" role="alert">
              <p>Не удалось загрузить предметы.</p>

              <Button type="button" onClick={() => void subjects.refetch()}>
                Повторить
              </Button>
            </div>
          )}

          {!subjects.isPending && !subjects.isError && (
            <>
              <label className="block space-y-2">
                <span className="field-label">Предмет</span>

                <Select
                  aria-label="Предмет"

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
                </Select>
              </label>

              <label className="block space-y-2">
                <span className="field-label">Название</span>

                <Input
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
                <span className="field-label">
                  Описание
                  <span className="ml-1 font-normal text-foreground-muted">(необязательно)</span>
                </span>

                <Textarea
                  className="min-h-32 resize-y"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Для кого программа и чему она посвящена"
                />
              </label>
            </>
          )}

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="h-10 rounded-control border border-border-strong px-4 text-sm font-medium"
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
      </DialogContent>
    </Dialog>
  );
}
