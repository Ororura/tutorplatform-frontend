"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  formatHomeworkDate,
  getStudentHomeworkPresentationState,
  studentHomeworkQueries,
  StudentHomeworkIcon,
  StudentHomeworkStatusBadge,
  StudentHomeworkTaskBadges,
} from "@/entities/homework";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { ProgressBar } from "@/shared/ui/progress-bar";
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
  const requiredItems = items.filter((item) => item.required);
  const passedRequired = requiredItems.filter((item) => item.passed).length;
  const optionalItems = items.filter((item) => !item.required);
  const passedOptional = optionalItems.filter((item) => item.passed).length;
  const progress = requiredItems.length ? (passedRequired / requiredItems.length) * 100 : 0;

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

      <section className="rounded-2xl border border-(--border) bg-white p-5 shadow-xs sm:p-6">
        <dl className="grid gap-5 sm:grid-cols-3">
          <HomeworkDate label="Назначено" value={data.assignedAt} />
          {data.dueAt && <HomeworkDate label="Срок" value={data.dueAt} />}
          {data.completedAt && <HomeworkDate label="Выполнено" value={data.completedAt} completed />}
        </dl>
        {data.description && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="wrap-break-word whitespace-pre-wrap text-sm leading-7 text-slate-700">{data.description}</p>
          </div>
        )}
      </section>

      <section
        className="rounded-2xl border border-(--border) bg-white p-4 shadow-xs sm:p-5"
        aria-labelledby="items-heading"
      >
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ClipboardList size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950" id="items-heading">
              Задания <span className="font-normal text-slate-500">· {items.length}</span>
            </h2>
            <p className="mt-1 text-sm leading-5 text-(--text-secondary)">
              Выполняйте задания по порядку. Некоторые задания могут зависеть от предыдущих.
            </p>
          </div>
        </div>
        {items.length === 0 && <p className="mt-5 text-sm text-slate-600">В этой работе пока нет заданий.</p>}
        <ol className="mt-5 space-y-2" aria-label="Задания">
          {items.map((item) => {
            const supported = item.task.taskType === "TEXT" || item.task.taskType === "CODE";
            const selected = openedItemId === item.id;
            return (
              <li
                className={cn(
                  "flex min-w-0 flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:gap-4",
                  selected
                    ? "border-blue-200 bg-blue-50/40"
                    : item.passed
                      ? "border-emerald-100 bg-emerald-50/30"
                      : "border-slate-100 bg-white",
                )}
                key={item.id}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                    item.passed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {item.position + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-word font-semibold text-slate-950">{item.task.title}</h3>
                  <div className="mt-2">
                    <StudentHomeworkTaskBadges item={item} />
                  </div>
                </div>
                {supported ? (
                  <Button
                    type="button"
                    variant="secondary"
                    aria-expanded={selected}
                    aria-controls={selected ? `task-${item.id}-solution` : undefined}
                    aria-label={`${selected ? "Открыто" : "Открыть"}: ${item.task.title}`}
                    className={cn(
                      "shrink-0 self-start sm:self-auto",
                      item.passed && !selected && "border-transparent bg-transparent text-emerald-700 shadow-none",
                    )}
                    onClick={() => setOpenedItemId(item.id)}
                  >
                    {item.passed && !selected && <CheckCircle2 size={17} className="mr-2" aria-hidden="true" />}
                    {selected ? "Открыто" : item.passed ? "Выполнено" : "Открыть"}
                    <ChevronRight size={16} className="ml-2" aria-hidden="true" />
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500">Пока не поддерживается</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {openedItem && (
        <StudentTaskSolution homeworkId={data.id} homeworkStatus={data.status} item={openedItem} key={openedItem.id} />
      )}

      <section
        className="flex items-start gap-4 rounded-2xl border border-(--border) bg-white p-5 shadow-xs sm:p-6"
        aria-labelledby="progress-heading"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ListChecks size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-950" id="progress-heading">
            Прогресс работы
          </h2>
          <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <ProgressBar value={progress} label="Выполнено обязательных заданий" />
            </div>
            <p className="shrink-0 text-xl font-semibold text-slate-950">
              {passedRequired}
              <span className="text-sm font-medium text-slate-500"> / {requiredItems.length}</span>
            </p>
          </div>
          <p className="mt-2 text-sm text-(--text-secondary)">
            {requiredItems.length
              ? `Выполнено ${passedRequired} из ${requiredItems.length} обязательных заданий`
              : "В этой работе нет обязательных заданий"}
          </p>
          {optionalItems.length > 0 && (
            <p className="mt-1 text-sm text-(--text-secondary)">
              Дополнительные задания: выполнено {passedOptional} из {optionalItems.length}
            </p>
          )}
        </div>
      </section>
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
