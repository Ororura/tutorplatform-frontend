"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, CalendarDays, CheckCircle2, ChevronRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  formatHomeworkDate,
  getStudentHomeworkPresentationState,
  studentHomeworkQueries,
  StudentHomeworkIcon,
  StudentHomeworkStatusBadge,
} from "@/entities/homework";
import { submissionStatusPresentation } from "@/entities/submission";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { StudentTaskSolution } from "@/widgets/student-task-solution";

export function StudentHomeworkDetailView({
  homeworkId,
}: Readonly<{
  homeworkId: string;
}>) {
  const homework = useQuery(studentHomeworkQueries.detail(homeworkId));

  const [openedItemId, setOpenedItemId] = useState<string | null>(null);

  if (homework.isPending) {
    return <HomeworkDetailSkeleton />;
  }

  if (homework.isError) {
    const notFound =
      homework.error instanceof ApiClientError
        ? homework.error.status === 404
        : (homework.error as { status?: number }).status === 404;

    return (
      <main className="mx-auto min-w-0 max-w-6xl space-y-5">
        <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-6" role="alert">
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
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
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
    <main className="mx-auto min-w-0 max-w-6xl space-y-5">
      <section className="py-2">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) transition hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          href="/student/homework"
        >
          <ArrowLeft size={16} />
          Домашние задания
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <StudentHomeworkIcon />

            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600">Домашняя работа</p>

              <h1 className="mt-1 wrap-break-word text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {data.title}
              </h1>
            </div>
          </div>

          <StudentHomeworkStatusBadge state={state} />
        </div>
      </section>

      <div className="space-y-5">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-(--border) bg-white p-5 shadow-xs sm:p-6">
            <dl className="grid gap-5 sm:grid-cols-3">
              <HomeworkDate label="Назначено" value={data.assignedAt} />
              {data.dueAt && <HomeworkDate label="Срок" value={data.dueAt} />}
              {data.completedAt && <HomeworkDate label="Выполнено" value={data.completedAt} completed />}
            </dl>

            {data.description && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="wrap-break-word whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {data.description}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-(--border) bg-white p-5 sm:p-6">
            <div>
              <p className="text-sm font-medium text-blue-600">Практика</p>

              <h2 className="mt-1 text-xl font-semibold text-slate-950" id="items-heading">
                Задания
              </h2>

              <p className="mt-1 text-sm text-(--text-secondary)">Выполняйте задания по порядку.</p>
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
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-(--text-secondary)">
                      {item.position + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="wrap-break-word font-semibold text-slate-950">{item.task.title}</h3>

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
                      <Button type="button" variant="secondary" onClick={() => setOpenedItemId(item.id)}>
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

        <aside>
          <section className="border-t border-(--border) pt-4">
            <CheckCircle2 size={21} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Прогресс работы</h2>

            <div className="mt-5 py-2">
              <div className="flex items-end justify-between">
                <span className="text-sm text-(--text-secondary)">Выполнено</span>

                <span className="text-2xl font-semibold text-slate-950">
                  {items.filter((item) => item.passed).length}
                  <span className="text-base font-medium text-slate-400"> / {items.length}</span>
                </span>
              </div>
            </div>

            <div className="mt-3 py-2">
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

function HomeworkDate({
  label,
  value,
  completed = false,
}: Readonly<{ label: string; value: string; completed?: boolean }>) {
  const Icon = completed ? CheckCircle2 : CalendarDays;
  return (
    <div className="flex min-w-0 items-center gap-4">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${completed ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
      >
        <Icon size={21} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-sm text-(--text-secondary)">{label}</dt>
        <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-900">
          <time dateTime={value}>{formatHomeworkDate(value)}</time>
        </dd>
      </div>
    </div>
  );
}

function HomeworkDetailSkeleton() {
  return (
    <main className="mx-auto min-w-0 max-w-6xl space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Загружаем домашнее задание…</span>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-14 w-2/3 rounded-xl bg-slate-200" />
        <div className="grid gap-5 rounded-2xl border border-slate-100 bg-white p-6 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="h-6 w-32 rounded bg-slate-100" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6">
          <div className="h-7 w-2/3 rounded bg-slate-100" />
          <div className="h-32 rounded-xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
