"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, CheckCircle2, ChevronRight, ClipboardList } from "lucide-react";
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

function getStatusClassName(state: string) {
  switch (state) {
    case "OVERDUE":
      return "bg-red-50 text-red-700";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export function StudentHomeworkDetailView({
  homeworkId,
}: Readonly<{
  homeworkId: string;
}>) {
  const homework = useQuery(studentHomeworkQueries.detail(homeworkId));

  const [openedItemId, setOpenedItemId] = useState<string | null>(null);

  if (homework.isPending) {
    return (
      <main>
        <div
          className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          aria-busy="true"
        >
          Загружаем домашнее задание…
        </div>
      </main>
    );
  }

  if (homework.isError) {
    const notFound =
      homework.error instanceof ApiClientError
        ? homework.error.status === 404
        : (homework.error as { status?: number }).status === 404;

    return (
      <main className="space-y-4">
        <div className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
          <p className="text-sm text-red-700">
            {notFound ? "Домашнее задание не найдено" : "Не удалось загрузить домашнее задание."}
          </p>

          {!notFound && (
            <Button variant="secondary" type="button" onClick={() => homework.refetch()}>
              Повторить
            </Button>
          )}
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
          href="/student/homework"
        >
          <ArrowLeft size={16} />
          Вернуться к домашним заданиям
        </Link>
      </main>
    );
  }

  const data = homework.data;

  const state = getStudentHomeworkPresentationState(data);

  const items = [...data.items].sort((left, right) => left.position - right.position);

  const openedItem = items.find((item) => item.id === openedItemId);

  return (
    <main className="space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href="/student/homework"
        >
          <ArrowLeft size={16} />
          Домашние задания
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardList size={21} />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600">Домашняя работа</p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{data.title}</h1>
            </div>
          </div>

          <span className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${getStatusClassName(state)}`}>
            {studentHomeworkStatusPresentation[state]}
          </span>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-sm text-slate-500">Назначено</dt>

                <dd className="mt-2 text-sm font-medium text-slate-900">{formatHomeworkDate(data.assignedAt)}</dd>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-sm text-slate-500">Срок</dt>

                <dd className="mt-2 text-sm font-medium text-slate-900">
                  {data.dueAt ? formatHomeworkDate(data.dueAt) : "Без срока"}
                </dd>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-sm text-slate-500">Выполнено</dt>

                <dd className="mt-2 text-sm font-medium text-slate-900">
                  {data.completedAt ? formatHomeworkDate(data.completedAt) : "—"}
                </dd>
              </div>
            </dl>

            {data.description && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{data.description}</p>
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
            <div>
              <p className="text-sm font-medium text-blue-600">Практика</p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950" id="items-heading">
                Задания
              </h2>

              <p className="mt-1 text-sm text-slate-500">Выполняйте задания по порядку.</p>
            </div>

            <ol className="mt-5 divide-y divide-slate-100" aria-labelledby="items-heading">
              {items.map((item) => {
                const supported = item.task.taskType === "TEXT" || item.task.taskType === "CODE";

                const itemStatus = item.passed
                  ? "Выполнено"
                  : item.latestSubmissionStatus
                    ? submissionStatusPresentation[item.latestSubmissionStatus]
                    : "Не начато";

                return (
                  <li
                    className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    key={item.id}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                      {item.position + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-950">{item.task.title}</h3>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {item.task.taskType === "TEXT"
                            ? "Текст"
                            : item.task.taskType === "CODE"
                              ? "Код"
                              : item.task.taskType}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {item.required ? "Обязательное" : "Дополнительное"}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 ${
                            item.passed ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {itemStatus}
                        </span>
                      </div>
                    </div>

                    {supported ? (
                      <Button
                        type="button"
                        variant={openedItemId === item.id ? "secondary" : "primary"}
                        onClick={() => setOpenedItemId(item.id)}
                      >
                        {openedItemId === item.id ? "Открыто" : "Решить"}

                        <ChevronRight size={16} className="ml-2" />
                      </Button>
                    ) : (
                      <span className="text-sm text-slate-400">Пока не поддерживается</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {openedItem && (
            <StudentTaskSolution
              homeworkId={data.id}
              homeworkStatus={data.status}
              item={openedItem}
              key={openedItem.id}
            />
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <CheckCircle2 size={21} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Прогресс работы</h2>

            <div className="mt-5 rounded-2xl bg-white/80 p-4">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-500">Выполнено</span>

                <span className="text-2xl font-semibold text-slate-950">
                  {items.filter((item) => item.passed).length}
                  <span className="text-base font-medium text-slate-400"> / {items.length}</span>
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-white/80 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarClock size={16} />

                {data.dueAt ? `Срок: ${formatHomeworkDate(data.dueAt)}` : "Без ограничения по сроку"}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
