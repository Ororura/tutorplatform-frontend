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
      <main className="page-stack min-w-0">
        <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-6" role="alert">
          <p className="text-sm text-danger">
            {notFound ? "Домашнее задание не найдено" : "Не удалось загрузить домашнее задание."}
          </p>

          {!notFound && (
            <Button variant="secondary" type="button" onClick={() => homework.refetch()}>
              Повторить
            </Button>
          )}
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
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
    <main className="page-stack min-w-0">
      <section className="py-2">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
          href="/student/homework"
        >
          <ArrowLeft size={16} />
          Домашние задания
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <StudentHomeworkIcon />

            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">Домашняя работа</p>

              <h1 className="page-title mt-1 wrap-break-word">{data.title}</h1>
            </div>
          </div>

          <div className="w-fit shrink-0">
            <StudentHomeworkStatusBadge state={state} />
          </div>
        </div>
      </section>

      <section className="surface">
        <dl className="grid gap-5 sm:grid-cols-3">
          <HomeworkDate label="Назначено" value={data.assignedAt} />
          {data.dueAt && <HomeworkDate label="Срок" value={data.dueAt} />}
          {data.completedAt && <HomeworkDate label="Выполнено" value={data.completedAt} completed />}
        </dl>
        {data.description && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="wrap-break-word whitespace-pre-wrap text-sm leading-7 text-foreground-muted">
              {data.description}
            </p>
          </div>
        )}
      </section>

      <section className="surface" aria-labelledby="items-heading">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
            <ClipboardList size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="section-title" id="items-heading">
              Задания <span className="font-normal text-foreground-muted">· {items.length}</span>
            </h2>
            <p className="mt-1 text-sm leading-5 text-(--text-secondary)">
              Выполняйте задания по порядку. Некоторые задания могут зависеть от предыдущих.
            </p>
          </div>
        </div>
        {items.length === 0 && <p className="mt-5 text-sm text-foreground-muted">В этой работе пока нет заданий.</p>}
        <ol className="mt-5 space-y-2" aria-label="Задания">
          {items.map((item) => {
            const supported = item.task.taskType === "TEXT" || item.task.taskType === "CODE";
            const selected = openedItemId === item.id;
            return (
              <li
                className={cn(
                  "flex min-w-0 flex-col gap-3 rounded-surface border p-4 sm:flex-row sm:items-center sm:gap-4",
                  selected
                    ? "border-primary-border bg-primary-subtle/40"
                    : item.passed
                      ? "border-success-border bg-success-subtle/30"
                      : "border-border bg-surface",
                )}
                key={item.id}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-surface text-sm font-semibold",
                    item.passed ? "bg-success-subtle text-success" : "bg-surface-subtle text-foreground-muted",
                  )}
                >
                  {item.position + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-word font-semibold text-foreground">{item.task.title}</h3>
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
                      item.passed && !selected && "border-transparent bg-transparent text-success shadow-none",
                    )}
                    onClick={() => setOpenedItemId(item.id)}
                  >
                    {item.passed && !selected && <CheckCircle2 size={17} className="mr-2" aria-hidden="true" />}
                    {selected ? "Открыто" : item.passed ? "Выполнено" : "Открыть"}
                    <ChevronRight size={16} className="ml-2" aria-hidden="true" />
                  </Button>
                ) : (
                  <span className="text-sm text-foreground-muted">Пока не поддерживается</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {openedItem && (
        <StudentTaskSolution homeworkId={data.id} homeworkStatus={data.status} item={openedItem} key={openedItem.id} />
      )}

      <section className="surface flex items-start gap-4" aria-labelledby="progress-heading">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
          <ListChecks size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="section-title" id="progress-heading">
            Прогресс работы
          </h2>
          <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <ProgressBar value={progress} label="Выполнено обязательных заданий" />
            </div>
            <p className="shrink-0 text-xl font-semibold text-foreground">
              {passedRequired}
              <span className="text-sm font-medium text-foreground-muted"> / {requiredItems.length}</span>
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
        className={`flex size-11 shrink-0 items-center justify-center rounded-surface ${completed ? "bg-success-subtle text-success" : "bg-primary-subtle text-primary"}`}
      >
        <Icon size={21} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-sm text-(--text-secondary)">{label}</dt>
        <dd className="mt-1 wrap-break-word text-sm font-medium text-foreground">
          <time dateTime={value}>{formatHomeworkDate(value)}</time>
        </dd>
      </div>
    </div>
  );
}

function HomeworkDetailSkeleton() {
  return (
    <main className="page-stack min-w-0" role="status" aria-busy="true">
      <span className="sr-only">Загружаем домашнее задание…</span>
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="h-4 w-40 rounded bg-surface-hover" />
        <div className="h-14 w-2/3 rounded-surface bg-surface-hover" />
        <div className="surface grid gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 rounded-surface bg-surface-subtle" />
          ))}
        </div>
        <div className="surface space-y-3">
          <div className="h-6 w-32 rounded bg-surface-subtle" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-surface bg-surface-subtle" />
          ))}
        </div>
        <div className="surface space-y-5">
          <div className="h-7 w-2/3 rounded bg-surface-subtle" />
          <div className="h-32 rounded-surface bg-surface-subtle" />
        </div>
      </div>
    </main>
  );
}
