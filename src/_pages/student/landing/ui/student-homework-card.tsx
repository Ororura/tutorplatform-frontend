import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";

import {
  studentHomeworkQueries,
  StudentHomeworkIcon,
  StudentHomeworkStatusBadge,
  type StudentHomeworkSummary,
} from "@/entities/homework";

import { buttonClassName } from "@/shared/ui/button";

import { formatDashboardDeadline, getDeadlineHint, isHomeworkOverdue } from "../model/dashboard-presentation";
import { DashboardProgress } from "./dashboard-primitives";

export function StudentHomeworkCard({
  homework,
  programTitle,
  priority,
  now,
}: Readonly<{
  homework: StudentHomeworkSummary;
  programTitle?: string;
  priority: boolean;
  now: number;
}>) {
  const details = useQuery(studentHomeworkQueries.detail(homework.id));
  const data = details.isError ? undefined : details.data;
  const completed = data?.items.filter((item) => item.passed).length;
  const total = data?.items.length;
  const percent = completed !== undefined && total ? Math.round((completed / total) * 100) : undefined;
  const started = data?.items.some((item) => item.latestSubmissionStatus || item.passed);
  const overdue = isHomeworkOverdue(homework, now);
  const today = homework.dueAt && new Date(homework.dueAt).toDateString() === new Date(now).toDateString();
  const action = data ? (started ? "Продолжить выполнение" : "Перейти к заданию") : "Открыть задание";

  return (
    <article
      aria-label={homework.title}
      className={`rounded-surface border bg-surface p-4 transition sm:p-5 ${priority && overdue ? "border-danger-border hover:bg-danger-subtle" : priority ? "border-border hover:bg-surface-subtle" : "border-border hover:bg-surface-subtle"}`}
    >
      <div className="grid gap-4 min-[1380px]:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          {priority &&
            (overdue ? (
              <StudentHomeworkStatusBadge state="OVERDUE" />
            ) : (
              <span className="inline-flex rounded-inset bg-primary-subtle px-3 py-1 text-xs font-medium text-primary">
                Ближайшее задание
              </span>
            ))}
          <div className={`flex items-start gap-3 ${priority ? "mt-3" : ""}`}>
            {!priority && <StudentHomeworkIcon />}
            <div className="min-w-0 flex-1">
              <h3 className="card-title wrap-break-word">{homework.title}</h3>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                {programTitle && (
                  <>
                    {programTitle}
                    <span aria-hidden="true"> · </span>
                  </>
                )}
                Заданий: {homework.itemsCount}
              </p>
              {data?.description && (
                <p className="mt-2 line-clamp-3 wrap-break-word text-sm leading-5 text-foreground-muted">
                  {data.description}
                </p>
              )}
              {percent !== undefined && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm font-medium text-foreground-muted">
                    {completed} из {total} выполнено
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <DashboardProgress value={percent} label={`Выполнение: ${homework.title}`} />
                    </div>
                    <span className="text-xs font-medium text-foreground-muted">{percent}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 min-[1380px]:pt-5">
          {homework.dueAt && (
            <div className="flex items-start gap-2 text-sm">
              <CalendarClock
                size={17}
                className={`mt-0.5 shrink-0 ${overdue ? "text-danger" : today ? "text-warning" : "text-foreground-subtle"}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-foreground-muted">
                  {overdue ? "Срок был " : "До "}
                  {formatDashboardDeadline(homework.dueAt, now)}
                </p>
                <p className={`mt-1 ${overdue ? "text-danger" : today ? "text-warning" : "text-foreground-muted"}`}>
                  {getDeadlineHint(homework.dueAt, now)}
                </p>
              </div>
            </div>
          )}
          <Link
            href={`/student/homework/${homework.id}`}
            className={buttonClassName(priority ? "primary" : "secondary", "group")}
          >
            {action}
            <ArrowRight size={16} className="shrink-0 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
