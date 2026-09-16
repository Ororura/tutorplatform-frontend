"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  formatHomeworkDate,
  getHomeworkPresentationState,
  homeworkQueries,
  homeworkStatusPresentation,
} from "@/entities/homework";
import { studentProgramQueries } from "@/entities/student-program";
import { useCancelHomeworkMutation } from "@/features/homework/cancel";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentHomeworkDetailView({
  studentId,
  homeworkId,
}: Readonly<{
  studentId: string;
  homeworkId: string;
}>) {
  const homework = useQuery(homeworkQueries.detail(studentId, homeworkId));
  const programs = useQuery(studentProgramQueries.list(studentId));
  const cancel = useCancelHomeworkMutation(studentId, homeworkId);
  const [cancelError, setCancelError] = useState("");
  if (homework.isPending)
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p aria-busy="true">Загружаем домашнее задание…</p>
      </main>
    );
  if (homework.isError) {
    const notFound = homework.error instanceof ApiClientError && homework.error.status === 404;
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>{notFound ? "Домашнее задание не найдено" : "Не удалось загрузить домашнее задание."}</p>
          {!notFound && (
            <Button type="button" onClick={() => homework.refetch()}>
              Повторить
            </Button>
          )}
        </div>
        <Link className="underline" href={`/teacher/students/${studentId}/homework`}>
          Вернуться к домашним заданиям
        </Link>
      </main>
    );
  }
  const state = getHomeworkPresentationState(homework.data);
  const program = programs.data?.find((item) => item.id === homework.data.studentProgramId);
  const items = [...homework.data.items].sort((a, b) => a.position - b.position);
  const onCancel = async () => {
    if (!window.confirm("Отменить это домашнее задание?")) return;
    setCancelError("");
    try {
      await cancel.mutateAsync();
    } catch {
      setCancelError("Не удалось отменить домашнее задание.");
    }
  };
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div>
        <Link className="text-sm text-neutral-600 underline" href={`/teacher/students/${studentId}/homework`}>
          ← Домашние задания
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{homework.data.title}</h1>
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-1 text-sm ${
                state === "OVERDUE" ? "bg-red-50 text-red-800" : "bg-neutral-100"
              }`}
            >
              {homeworkStatusPresentation[state]}
            </span>
          </div>
          {homework.data.status === "ASSIGNED" && (
            <div className="flex gap-3">
              <Link
                className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium"
                href={`/teacher/students/${studentId}/homework/${homeworkId}/edit`}
              >
                Редактировать
              </Link>
              <Button
                className="bg-red-700 hover:bg-red-600"
                type="button"
                disabled={cancel.isPending}
                onClick={onCancel}
              >
                {cancel.isPending ? "Отменяем…" : "Отменить домашнее задание"}
              </Button>
            </div>
          )}
        </div>
      </div>
      {cancelError && (
        <p className="text-red-700" role="alert">
          {cancelError}
        </p>
      )}
      <section className="rounded-lg border bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-neutral-500">Программа</dt>
            <dd>{program ? `${program.title} · ${program.subject.name}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Назначено</dt>
            <dd>{formatHomeworkDate(homework.data.assignedAt)}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Срок</dt>
            <dd>{homework.data.dueAt ? formatHomeworkDate(homework.data.dueAt) : "Без срока"}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Выполнено</dt>
            <dd>{homework.data.completedAt ? formatHomeworkDate(homework.data.completedAt) : "—"}</dd>
          </div>
        </dl>
        {homework.data.description && (
          <div className="mt-5 border-t pt-5">
            <h2 className="mb-2 font-medium">Описание</h2>
            <p className="whitespace-pre-wrap">{homework.data.description}</p>
          </div>
        )}
      </section>
      <section className="space-y-4" aria-labelledby="items-heading">
        <h2 id="items-heading" className="text-xl font-semibold">
          Задания
        </h2>
        <ol className="divide-y rounded-lg border bg-white">
          {items.map((item) => (
            <li className="flex items-center gap-4 p-4" key={item.id}>
              <span className="text-neutral-500">{item.position + 1}.</span>
              {item.taskId ? (
                <Link
                  className="flex-1 font-medium underline underline-offset-4"
                  href={`/teacher/tasks/${item.taskId}`}
                >
                  {item.taskTitle ?? "Открыть задание"}
                </Link>
              ) : (
                <span className="flex-1">{item.taskTitle ?? "Задание"}</span>
              )}
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs">
                {item.required ? "Обязательное" : "Необязательное"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
