"use client";

import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import {
  formatHomeworkItemsCount,
  formatStudentHomeworkDeadline,
  isHomeworkOverdue,
  studentHomeworkQueries,
  type StudentHomeworkSummary,
} from "@/entities/homework";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";
import styles from "./student-homeworks.module.css";

const tabs = { active: "В работе", review: "На проверке", completed: "Завершённые" } as const;
type Tab = keyof typeof tabs;

export function StudentHomeworksView() {
  const [tab, setTab] = useState<Tab>("active");
  const id = useId();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const active = useInfiniteQuery(
    studentHomeworkQueries.infiniteList({ status: "ASSIGNED", size: 20, sort: "dueAt,asc" }),
  );
  const completed = useInfiniteQuery(
    studentHomeworkQueries.infiniteList({ status: "COMPLETED", size: 20, sort: "assignedAt,desc" }),
  );
  const cancelled = useInfiniteQuery(
    studentHomeworkQueries.infiniteList({ status: "CANCELLED", size: 20, sort: "assignedAt,desc" }),
  );
  const programs = useQuery(studentProgramQueries.currentList());
  const activeItems = active.data?.pages.flatMap((page) => page.items) ?? [];
  // Summaries do not include submission states. Reuse cached detail queries for
  // the loaded page instead of inventing a review status from the deadline.
  const details = useQueries({
    queries: activeItems.map((item) => ({ ...studentHomeworkQueries.detail(item.id), staleTime: 60_000 })),
  });
  const reviewIds = new Set(
    details.flatMap(({ data }) => {
      if (!data) return [];
      const required = data.items.filter((item) => item.required);
      const waiting = (status: string | null | undefined) => status === "SUBMITTED" || status === "NEEDS_REVIEW";
      return required.length > 0 &&
        required.every((item) => item.passed || waiting(item.latestSubmissionStatus)) &&
        required.some((item) => !item.passed && waiting(item.latestSubmissionStatus))
        ? [data.id]
        : [];
    }),
  );
  const history = [completed, cancelled]
    .flatMap((query) => query.data?.pages.flatMap((page) => page.items) ?? [])
    .sort((a, b) => Date.parse(b.assignedAt) - Date.parse(a.assignedAt) || b.id.localeCompare(a.id));
  const items =
    tab === "completed"
      ? history
      : activeItems.filter((item) => (tab === "review" ? reviewIds.has(item.id) : !reviewIds.has(item.id)));
  const ordered =
    tab === "completed"
      ? items
      : [...items].sort(
          (a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity),
        );
  const selected = tab === "completed" ? [completed, cancelled] : [active, ...details];
  const pending = selected.some((query) => query.isPending);
  const failed = selected.some((query) => query.isError);
  const pageQueries = tab === "completed" ? [completed, cancelled] : [active];
  const programTitles = new Map(
    (programs.isError ? [] : (programs.data ?? [])).map((program) => [program.id, program.title]),
  );
  const firstActiveId = ordered[0]?.id;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Задания</h1>
        <p>Всё, над чем вы сейчас работаете.</p>
      </header>
      <div role="tablist" aria-label="Статус заданий" className={styles.tabs}>
        {(Object.keys(tabs) as Tab[]).map((key, index, keys) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}`}
            aria-selected={tab === key}
            aria-controls={`${id}-panel`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % keys.length
                  : event.key === "ArrowLeft"
                    ? (index + keys.length - 1) % keys.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? keys.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                setTab(keys[next]);
                document.getElementById(`${id}-${keys[next]}`)?.focus();
              }
            }}
          >
            {tabs[key]}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${tab}`}
        tabIndex={0}
        className={styles.panel}
      >
        {pending && (
          <div role="status" aria-busy="true" className={styles.loading}>
            <span className="sr-only">Загружаем задания…</span>
            {[0, 1, 2].map((key) => (
              <div key={key} aria-hidden="true" />
            ))}
          </div>
        )}
        {failed && (
          <div role="alert" className={styles.error}>
            <p>Не удалось загрузить часть заданий. Уже загруженные работы доступны ниже.</p>
            <Button
              variant="secondary"
              onClick={() => selected.filter((query) => query.isError).forEach((query) => void query.refetch())}
            >
              Повторить
            </Button>
          </div>
        )}
        {!pending && !failed && ordered.length === 0 && (
          <div className={styles.empty}>
            <h2>
              {tab === "review"
                ? "Нет заданий на проверке"
                : tab === "completed"
                  ? "Завершённых заданий пока нет"
                  : "Заданий в работе пока нет"}
            </h2>
            <p>
              {tab === "active"
                ? "Когда преподаватель назначит новое задание, оно появится здесь."
                : tab === "review"
                  ? "Здесь появятся работы, которые ожидают проверки преподавателя."
                  : "Здесь будут выполненные и отменённые работы."}
            </p>
          </div>
        )}
        <ul className={styles.list}>
          {ordered.map((homework: StudentHomeworkSummary) => {
            const overdue = isHomeworkOverdue(homework, now);
            const primary = tab === "active" && homework.id === firstActiveId;
            const program = programTitles.get(homework.studentProgramId);
            return (
              <li key={homework.id}>
                <article aria-label={homework.title} className={styles.row}>
                  <div className={styles.info}>
                    <h2>
                      <Link href={`/student/homework/${homework.id}`}>{homework.title}</Link>
                    </h2>
                    <p>
                      {program || formatHomeworkItemsCount(homework.itemsCount)}
                      {homework.dueAt && tab !== "completed" && (
                        <>
                          {" "}
                          ·{" "}
                          <span className={overdue ? styles.overdue : undefined}>
                            {overdue ? "Срок был " : "До "}
                            <time dateTime={homework.dueAt}>{formatStudentHomeworkDeadline(homework.dueAt, now)}</time>
                            {overdue && " · Просрочено"}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className={styles.action}>
                    {tab !== "active" && (
                      <span className={styles.status}>
                        {tab === "review" ? "На проверке" : homework.status === "CANCELLED" ? "Отменено" : "Выполнено"}
                      </span>
                    )}
                    <Link
                      href={`/student/homework/${homework.id}`}
                      aria-label={`${primary ? "Продолжить" : "Открыть"}: ${homework.title}`}
                      className={primary ? styles.primary : styles.link}
                    >
                      {primary ? "Продолжить" : "Открыть"}
                      {!primary && <ArrowRight size={19} aria-hidden="true" />}
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        {pageQueries.some((query) => query.hasNextPage) && (
          <Button
            variant="ghost"
            className="mt-6"
            disabled={pageQueries.some((query) => query.isFetchingNextPage)}
            onClick={() =>
              pageQueries.filter((query) => query.hasNextPage).forEach((query) => void query.fetchNextPage())
            }
          >
            {pageQueries.some((query) => query.isFetchingNextPage) ? "Загружаем…" : "Загрузить ещё задания"}
          </Button>
        )}
      </section>
    </main>
  );
}
