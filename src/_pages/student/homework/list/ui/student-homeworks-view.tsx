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
    <main className="page-stack">
      <header className="py-2">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-surface bg-surface-subtle text-(--text-secondary)">
            <ClipboardCheck size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-(--text-secondary)">Учебный кабинет</p>
            <h1 className="page-title mt-1 wrap-break-word">Домашние задания</h1>
            <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
              Задания преподавателя и результаты их проверки.
            </p>
          </div>
        </div>
      </header>

      {pending && <StudentHomeworkSkeleton />}
      {failed && (
        <div className="space-y-3 rounded-surface border border-danger-border bg-surface p-5" role="alert">
          <p className="text-sm text-danger">Не удалось загрузить домашние задания.</p>
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
        <section className="rounded-surface border border-(--border) bg-surface px-4 py-10 text-center">
          <ClipboardCheck size={30} className="mx-auto text-primary" aria-hidden="true" />
          <h2 className="section-title mt-4">Домашних заданий пока нет</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--text-secondary)">
            Когда преподаватель назначит новое задание, оно появится здесь.
          </p>
        </section>
      )}
      {attention.length > 0 && (
        <section
          aria-labelledby="homework-attention-heading"
          className="rounded-surface border border-danger-border bg-danger-subtle/40 p-4"
        >
          <h2 id="homework-attention-heading" className="section-title mb-3 flex items-center gap-3">
            <CircleAlert size={28} className="shrink-0 text-danger" aria-hidden="true" />
            Требуют внимания <span className="text-danger">· {attention.length}</span>
          </h2>
          <StudentHomeworkList homeworks={attention} now={now} programTitles={programTitles} />
        </section>
      )}
      {upcoming.length > 0 && (
        <section aria-labelledby="homework-upcoming-heading" className="surface">
          <h2 id="homework-upcoming-heading" className="section-title mb-3 flex items-center gap-3">
            <Clock3 size={28} className="shrink-0 text-primary" aria-hidden="true" />
            Предстоящие <span className="text-primary">· {upcoming.length}</span>
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
        <div key={count} aria-hidden="true" className="surface space-y-3 motion-safe:animate-pulse">
          <div className="h-6 w-48 rounded bg-surface-subtle" />
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-surface border border-border p-5 sm:flex-row sm:items-center"
            >
              <div className="hidden size-14 shrink-0 rounded-surface bg-primary-subtle sm:block" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-2/3 rounded bg-surface-subtle" />
                <div className="h-3 w-1/2 rounded bg-surface-subtle" />
                <div className="h-3 w-3/4 rounded bg-surface-subtle" />
              </div>
              <div className="h-10 rounded-surface bg-primary-subtle sm:w-32" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
