"use client";
import { Input, Select, Textarea } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import type { HomeworkDetails } from "@/entities/homework";
import { isoToLocalDateTime, localDateTimeToIso } from "@/entities/session";
import { programStatusLabels, studentProgramQueries } from "@/entities/student-program";
import { type Task, taskDifficultyPresentation, taskQueries, taskTypePresentation } from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateHomeworkMutation, useUpdateHomeworkMutation } from "../api/homework-mutations";

type SelectedTask = {
  taskId: string;
  title: string;
  taskType?: Task["taskType"];
  difficulty?: Task["difficulty"];
  required: boolean;
};

export function HomeworkForm({ studentId, homework }: Readonly<{ studentId: string; homework?: HomeworkDetails }>) {
  const router = useRouter();
  const programs = useQuery(studentProgramQueries.list(studentId));
  const [programId, setProgramId] = useState(homework?.studentProgramId ?? "");
  const effectiveProgramId = programId || (!homework && programs.data?.length === 1 ? programs.data[0].id : "");
  const program = programs.data?.find((item) => item.id === effectiveProgramId);
  const [taskPage, setTaskPage] = useState(0);
  const tasks = useQuery({
    ...taskQueries.list({
      page: taskPage,
      size: 10,
      sort: "updatedAt,desc",
      status: "ACTIVE",
      ...(program ? { subjectId: program.subject.id } : {}),
    }),
    enabled: Boolean(program),
  });
  const [title, setTitle] = useState(homework?.title ?? "");
  const [description, setDescription] = useState(homework?.description ?? "");
  const [dueAt, setDueAt] = useState(homework?.dueAt ? isoToLocalDateTime(homework.dueAt) : "");
  const [selected, setSelected] = useState<SelectedTask[]>(
    homework?.items.map((item) => ({
      taskId: item.taskId,
      title: item.taskTitle ?? "Задание",
      required: item.required,
    })) ?? [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateHomeworkMutation(studentId);
  const update = useUpdateHomeworkMutation(studentId, homework?.id ?? "new");
  const mutation = homework ? update : create;

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.taskId)), [selected]);
  const changeProgram = (value: string) => {
    setProgramId(value);
    setTaskPage(0);
    setSelected([]);
    setErrors((current) => ({ ...current, studentProgramId: "" }));
  };
  const toggleTask = (task: Task, checked: boolean) =>
    setSelected((current) =>
      checked
        ? [
            ...current,
            {
              taskId: task.id,
              title: task.title,
              taskType: task.taskType,
              difficulty: task.difficulty,
              required: true,
            },
          ]
        : current.filter((item) => item.taskId !== task.id),
    );
  const move = (index: number, delta: number) =>
    setSelected((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    const nextErrors: Record<string, string> = {};
    if (!effectiveProgramId) nextErrors.studentProgramId = "Выберите программу";
    if (!title.trim()) nextErrors.title = "Введите название";
    if (selected.length === 0) nextErrors.items = "Выберите хотя бы одно задание";
    let dueAtIso: string | undefined;
    if (dueAt) {
      try {
        dueAtIso = localDateTimeToIso(dueAt);
      } catch {
        nextErrors.dueAt = "Укажите корректные дату и время";
      }
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    try {
      const common = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAtIso,
        items: selected.map((item, position) => ({ taskId: item.taskId, required: item.required, position })),
      };
      const saved = homework
        ? await update.mutateAsync({
            ...common,
            version: homework.version,
          })
        : await create.mutateAsync({ ...common, studentProgramId: effectiveProgramId });
      router.push(`/teacher/students/${studentId}/homework/${saved.id}`);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 400) {
        setErrors({
          server: "Проверьте заполненные данные и доступность заданий.",
          ...Object.fromEntries(error.body.details.map((detail) => [detail.field, detail.message])),
        });
      } else if (error instanceof ApiClientError && (error.status === 404 || error.status === 409)) {
        setErrors({ server: "Программа или задания изменились. Обновите данные и повторите." });
        void programs.refetch();
        void tasks.refetch();
      } else setErrors({ server: "Не удалось сохранить домашнее задание." });
    }
  };

  if (programs.isPending) return <p aria-busy="true">Загружаем программы ученика…</p>;
  if (programs.isError)
    return (
      <div role="alert">
        <p>Не удалось загрузить программы ученика.</p>
        <Button type="button" onClick={() => programs.refetch()}>
          Повторить
        </Button>
      </div>
    );
  if (programs.data.length === 0)
    return (
      <div className="space-y-4 rounded-inset border border-dashed p-8 text-center border-border">
        <p className="font-medium">Сначала назначьте ученику программу обучения</p>
        <a className="underline" href={`/teacher/students/${studentId}/program`}>
          Перейти в раздел «Программа»
        </a>
      </div>
    );

  return (
    <form className="surface space-y-6" onSubmit={submit} noValidate>
      <label className="block space-y-2">
        <span className="field-label">Программа обучения</span>
        <Select
          aria-label="Программа обучения"
          aria-invalid={Boolean(errors.studentProgramId)}
          aria-describedby={errors.studentProgramId ? "homework-studentProgramId-error" : undefined}

          disabled={Boolean(homework)}
          value={effectiveProgramId}
          onChange={(event) => changeProgram(event.target.value)}
        >
          <option value="">Выберите программу</option>
          {programs.data.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} · {item.subject.name} · {programStatusLabels[item.status]}
            </option>
          ))}
        </Select>
        {program && (
          <p className="text-xs text-foreground-muted">
            Задания будут отфильтрованы по предмету «{program.subject.name}».
          </p>
        )}
        {errors.studentProgramId && (
          <p id="homework-studentProgramId-error" role="alert" className="field-error">
            {errors.studentProgramId}
          </p>
        )}
      </label>
      <label className="block space-y-2">
        <span className="field-label">Название</span>
        <Input
          maxLength={220}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "homework-title-error" : undefined}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {errors.title && (
          <p id="homework-title-error" role="alert" className="field-error">
            {errors.title}
          </p>
        )}
      </label>
      <label className="block space-y-2">
        <span className="field-label">Описание</span>
        <Textarea className="min-h-28" value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label className="block space-y-2">
        <span className="field-label">Срок</span>
        <Input
          aria-label="Срок"
          aria-invalid={Boolean(errors.dueAt)}
          aria-describedby={errors.dueAt ? "homework-dueAt-error" : undefined}

          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
        />
        <p className="text-xs text-foreground-muted">
          Оставьте пустым, чтобы назначить без срока. Время указано в вашем часовом поясе.
        </p>
        {errors.dueAt && (
          <p id="homework-dueAt-error" role="alert" className="field-error">
            {errors.dueAt}
          </p>
        )}
      </label>
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Выбрать задания</legend>
        {!program && <p className="text-sm text-foreground-muted">Сначала выберите программу.</p>}
        {program && tasks.isPending && <p aria-busy="true">Загружаем активные задания…</p>}
        {tasks.isError && (
          <div role="alert">
            <p>Не удалось загрузить задания.</p>
            <Button type="button" onClick={() => tasks.refetch()}>
              Повторить
            </Button>
          </div>
        )}
        {tasks.data?.items.length === 0 && (
          <p className="rounded-control bg-surface-subtle p-4 text-sm">Для предмета нет активных заданий.</p>
        )}
        {tasks.data && tasks.data.items.length > 0 && (
          <div className="divide-y rounded-inset border border-border divide-border">
            {tasks.data.items.map((task) => (
              <label className="flex items-center gap-3 p-3" key={task.id}>
                <Input
                  type="checkbox"
                  checked={selectedIds.has(task.id)}
                  onChange={(event) => toggleTask(task, event.target.checked)}
                />
                <span className="flex-1">{task.title}</span>
                <span className="text-xs text-foreground-muted">
                  {taskTypePresentation[task.taskType]} · {taskDifficultyPresentation[task.difficulty]}
                </span>
              </label>
            ))}
          </div>
        )}
        {tasks.data && tasks.data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-50 border-border"
              type="button"
              disabled={taskPage === 0 || tasks.isFetching}
              onClick={() => setTaskPage((value) => value - 1)}
            >
              Назад
            </button>
            <span className="text-sm">
              Страница {taskPage + 1} из {tasks.data.totalPages}
            </span>
            <button
              className="rounded border px-3 py-2 text-sm disabled:opacity-50 border-border"
              type="button"
              disabled={taskPage + 1 >= tasks.data.totalPages || tasks.isFetching}
              onClick={() => setTaskPage((value) => value + 1)}
            >
              Вперёд
            </button>
          </div>
        )}
        {errors.items && <p className="text-sm text-danger">{errors.items}</p>}
      </fieldset>
      {selected.length > 0 && (
        <section className="space-y-3" aria-labelledby="selected-heading">
          <h2 id="selected-heading" className="section-title">
            Порядок заданий
          </h2>
          <ol className="space-y-2">
            {selected.map((item, index) => (
              <li
                className="flex flex-wrap items-center gap-3 rounded-control border p-3 border-border"
                key={item.taskId}
              >
                <span className="w-6 text-foreground-muted">{index + 1}.</span>
                <span className="min-w-48 flex-1">
                  {item.title}
                  {item.taskType && item.difficulty ? (
                    <span className="ml-2 text-xs text-foreground-muted">
                      {taskTypePresentation[item.taskType]} · {taskDifficultyPresentation[item.difficulty]}
                    </span>
                  ) : null}
                </span>
                <label className="flex items-center gap-2 text-sm">
                  <Input
                    type="checkbox"
                    checked={item.required}
                    onChange={(event) =>
                      setSelected((current) =>
                        current.map((value, position) =>
                          position === index
                            ? {
                                ...value,
                                required: event.target.checked,
                              }
                            : value,
                        ),
                      )
                    }
                  />
                  Обязательное
                </label>
                <button
                  aria-label={`Поднять ${item.title}`}
                  className="rounded border px-2 py-1 disabled:opacity-40 border-border"
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  aria-label={`Опустить ${item.title}`}
                  className="rounded border px-2 py-1 disabled:opacity-40 border-border"
                  type="button"
                  disabled={index === selected.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
      {errors.server && (
        <p className="text-sm text-danger" role="alert">
          {errors.server}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" loading={mutation.isPending}>
          {mutation.isPending ? "Сохраняем…" : homework ? "Сохранить изменения" : "Назначить"}
        </Button>
        <Button variant="secondary" type="button" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
