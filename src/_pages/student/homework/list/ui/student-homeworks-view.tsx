"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CircleAlert, ClipboardCheck, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { isHomeworkOverdue, StudentHomeworkList, studentHomeworkQueries } from "@/entities/homework";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

import { StudentHomeworkHistory } from "./student-homework-history";

export function StudentHomeworksView() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const active = useInfiniteQuery(
    studentHomeworkQueries.infiniteList({ status: "ASSIGNED", size: 20, sort: "dueAt,asc" }),
  );
  const completed = useInfiniteQuery(
    studentHomeworkQueries.infiniteList({ status: "COMPLETED", size: 3, sort: "assignedAt,desc" }),
  );
  const cancelled = useInfiniteQuery(
    studentHomeworkQueries.infiniteList({ status: "CANCELLED", size: 3, sort: "assignedAt,desc" }),
  );
  const programs = useQuery(studentProgramQueries.currentList());
  const queries = [active, completed, cancelled];
  const pending = queries.some((query) => query.isPending);
  const failed = queries.some((query) => query.isError);
  const activeItems = active.data?.pages.flatMap((page) => page.items) ?? [];
  const attention = activeItems.filter((homework) => isHomeworkOverdue(homework, now));
  // The API orders deadlines ascending; keep that order, placing undated work last.
  const upcoming = activeItems.filter((homework) => !isHomeworkOverdue(homework, now));
  const datedUpcoming = upcoming.filter((homework) => homework.dueAt);
  const undatedUpcoming = upcoming.filter((homework) => !homework.dueAt);
  const history = [completed, cancelled]
    .flatMap((query) => query.data?.pages.flatMap((page) => page.items) ?? [])
    .sort((a, b) => Date.parse(b.assignedAt) - Date.parse(a.assignedAt) || b.id.localeCompare(a.id));
  const programTitles = new Map(
    (programs.isError ? [] : (programs.data ?? [])).map((program) => [program.id, program.title]),
  );
  const empty = !pending && !failed && activeItems.length === 0 && history.length === 0;

  return (
    <main className="mx-auto max-w-360 space-y-5">
      <header className="py-2">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-(--text-secondary)">
            <ClipboardCheck size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-(--text-secondary)">Учебный кабинет</p>
            <h1 className="mt-1 wrap-break-word text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Домашние задания
            </h1>
            <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
              Задания преподавателя и результаты их проверки.
            </p>
          </div>
        </div>
      </header>

      {pending && <StudentHomeworkSkeleton />}
      {failed && (
        <div className="space-y-3 rounded-2xl border border-red-100 bg-white p-5" role="alert">
          <p className="text-sm text-red-700">Не удалось загрузить домашние задания.</p>
          <Button
            variant="secondary"
            type="button"
            onClick={() => queries.filter((query) => query.isError).forEach((query) => void query.refetch())}
          >
            Повторить
          </Button>
        </div>
      )}
      {empty && (
        <section className="rounded-2xl border border-(--border) bg-white px-4 py-10 text-center shadow-xs">
          <ClipboardCheck size={30} className="mx-auto text-blue-500" aria-hidden="true" />
          <h2 className="mt-4 font-semibold text-slate-950">Домашних заданий пока нет</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--text-secondary)">
            Когда преподаватель назначит новое задание, оно появится здесь.
          </p>
        </section>
      )}
      {attention.length > 0 && (
        <section
          aria-labelledby="homework-attention-heading"
          className="rounded-2xl border border-red-100 bg-red-50/40 p-4"
        >
          <h2
            id="homework-attention-heading"
            className="mb-3 flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl"
          >
            <CircleAlert size={28} className="shrink-0 text-red-600" aria-hidden="true" />
            Требуют внимания <span className="text-red-600">· {attention.length}</span>
          </h2>
          <StudentHomeworkList homeworks={attention} now={now} programTitles={programTitles} />
        </section>
      )}
      {upcoming.length > 0 && (
        <section
          aria-labelledby="homework-upcoming-heading"
          className="rounded-2xl border border-(--border) bg-white p-4 shadow-xs"
        >
          <h2
            id="homework-upcoming-heading"
            className="mb-3 flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl"
          >
            <Clock3 size={28} className="shrink-0 text-blue-600" aria-hidden="true" />
            Предстоящие <span className="text-blue-600">· {upcoming.length}</span>
          </h2>
          <StudentHomeworkList
            homeworks={[...datedUpcoming, ...undatedUpcoming]}
            now={now}
            programTitles={programTitles}
          />
        </section>
      )}
      {active.hasNextPage && (
        <Button variant="secondary" disabled={active.isFetchingNextPage} onClick={() => void active.fetchNextPage()}>
          {active.isFetchingNextPage ? "Загружаем…" : "Загрузить ещё задания"}
        </Button>
      )}
      {history.length > 0 && (
        <StudentHomeworkHistory
          homeworks={history}
          hasMore={completed.hasNextPage || cancelled.hasNextPage}
          loading={completed.isFetchingNextPage || cancelled.isFetchingNextPage}
          loadMore={() => {
            if (completed.hasNextPage) void completed.fetchNextPage();
            if (cancelled.hasNextPage) void cancelled.fetchNextPage();
          }}
        />
      )}
    </main>
  );
}

function StudentHomeworkSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Загружаем домашние задания…</span>
      {[2, 1].map((count) => (
        <div
          key={count}
          aria-hidden="true"
          className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 motion-safe:animate-pulse"
        >
          <div className="h-6 w-48 rounded bg-slate-100" />
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-5 sm:flex-row sm:items-center"
            >
              <div className="hidden size-14 shrink-0 rounded-2xl bg-blue-50 sm:block" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-2/3 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
                <div className="h-3 w-3/4 rounded bg-slate-100" />
              </div>
              <div className="h-10 rounded-xl bg-blue-50 sm:w-32" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
