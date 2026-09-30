import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";

import {
  studentHomeworkQueries,
  StudentHomeworkIcon,
  StudentHomeworkStatusBadge,
  type StudentHomeworkSummary,
} from "@/entities/homework";

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
      className={`rounded-2xl border p-4 transition sm:p-5 ${priority && overdue ? "border-red-200 bg-red-50/30 hover:border-red-300" : priority ? "border-blue-200 bg-blue-50/20 hover:border-blue-300" : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/10"}`}
    >
      <div className="grid gap-4 min-[1380px]:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          {priority &&
            (overdue ? (
              <StudentHomeworkStatusBadge state="OVERDUE" />
            ) : (
              <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Ближайшее задание
              </span>
            ))}
          <div className={`flex items-start gap-3 ${priority ? "mt-3" : ""}`}>
            {!priority && <StudentHomeworkIcon />}
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
                {homework.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {programTitle && (
                  <>
                    {programTitle}
                    <span aria-hidden="true"> · </span>
                  </>
                )}
                Заданий: {homework.itemsCount}
              </p>
              {data?.description && (
                <p className="mt-2 line-clamp-3 break-words text-sm leading-5 text-slate-500">{data.description}</p>
              )}
              {percent !== undefined && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm font-medium text-slate-600">
                    {completed} из {total} выполнено
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <DashboardProgress value={percent} label={`Выполнение: ${homework.title}`} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{percent}%</span>
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
                className={`mt-0.5 shrink-0 ${overdue ? "text-red-500" : today ? "text-amber-600" : "text-slate-400"}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-slate-500">
                  {overdue ? "Срок был " : "До "}
                  {formatDashboardDeadline(homework.dueAt, now)}
                </p>
                <p className={`mt-1 ${overdue ? "text-red-600" : today ? "text-amber-700" : "text-slate-500"}`}>
                  {getDeadlineHint(homework.dueAt, now)}
                </p>
              </div>
            </div>
          )}
          <Link
            href={`/student/homework/${homework.id}`}
            className={`group inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${priority ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:bg-blue-50"}`}
          >
            {action}
            <ArrowRight size={16} className="shrink-0 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
