"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  formatHomeworkDate,
  getStudentHomeworkPresentationState,
  studentHomeworkQueries,
  studentHomeworkStatusPresentation,
} from "@/entities/homework";
import { submissionStatusPresentation } from "@/entities/submission";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { StudentTaskSolution } from "./student-task-solution";

export function StudentHomeworkDetailView({ homeworkId }: Readonly<{ homeworkId: string }>) {
  const homework = useQuery(studentHomeworkQueries.detail(homeworkId));
  const [openedItemId, setOpenedItemId] = useState<string | null>(null);

  if (homework.isPending) {
    return <main className="mx-auto max-w-4xl px-6 py-12"><p aria-busy="true">Загружаем домашнее задание…</p></main>;
  }
  if (homework.isError) {
    const notFound = homework.error instanceof ApiClientError || (homework.error as { status?: number }).status === 404;
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>{notFound ? "Домашнее задание не найдено" : "Не удалось загрузить домашнее задание."}</p>
          {!notFound && <Button type="button" onClick={() => homework.refetch()}>Повторить</Button>}
        </div>
        <Link className="underline" href="/student/homework">Вернуться к домашним заданиям</Link>
      </main>
    );
  }

  const data = homework.data;
  const state = getStudentHomeworkPresentationState(data);
  const items = [...data.items].sort((left, right) => left.position - right.position);
  const openedItem = items.find((item) => item.id === openedItemId);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header>
        <Link className="text-sm text-neutral-600 underline" href="/student/homework">← Домашние задания</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold">{data.title}</h1>
          <span className={`rounded-full px-2.5 py-1 text-sm ${state === "OVERDUE" ? "bg-red-50 text-red-800" : "bg-neutral-100"}`}>
            {studentHomeworkStatusPresentation[state]}
          </span>
        </div>
      </header>
      <section className="space-y-5 rounded-lg border bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="text-sm text-neutral-500">Назначено</dt><dd>{formatHomeworkDate(data.assignedAt)}</dd></div>
          <div><dt className="text-sm text-neutral-500">Срок</dt><dd>{data.dueAt ? formatHomeworkDate(data.dueAt) : "Без срока"}</dd></div>
          <div><dt className="text-sm text-neutral-500">Выполнено</dt><dd>{data.completedAt ? formatHomeworkDate(data.completedAt) : "—"}</dd></div>
        </dl>
        {data.description && <p className="whitespace-pre-wrap border-t pt-5">{data.description}</p>}
      </section>
      <section className="space-y-4" aria-labelledby="items-heading">
        <h2 className="text-xl font-semibold" id="items-heading">Задания</h2>
        <ol className="divide-y rounded-lg border bg-white">
          {items.map((item) => {
            const supported = item.task.taskType === "TEXT" || item.task.taskType === "CODE";
            return (
              <li className="flex flex-wrap items-center gap-3 p-4" key={item.id}>
                <span className="text-neutral-500">{item.position + 1}.</span>
                <div className="min-w-48 flex-1">
                  <h3 className="font-medium">{item.task.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{item.task.taskType}</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs">{item.required ? "Обязательное" : "Дополнительное"}</span>
                <span className="text-sm">{item.passed ? "Выполнено" : item.latestSubmissionStatus ? submissionStatusPresentation[item.latestSubmissionStatus] : "Не начато"}</span>
                {supported ? (
                  <Button type="button" onClick={() => setOpenedItemId(item.id)}>{openedItemId === item.id ? "Открыто" : "Решить"}</Button>
                ) : (
                  <span className="text-sm text-neutral-600">Пока не поддерживается</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      {openedItem && <StudentTaskSolution homeworkId={data.id} homeworkStatus={data.status} item={openedItem} key={openedItem.id} />}
    </main>
  );
}
