import { CalendarClock } from "lucide-react";
import Link from "next/link";

import type { StudentHomeworkSummary } from "@/entities/homework";
import { useCurrentUserQuery } from "@/entities/user";

import { formatDashboardDeadline, isHomeworkOverdue } from "../model/dashboard-presentation";
import { DashboardError } from "./dashboard-primitives";

export function StudentDashboardHeader({
  attentionCount,
  nearest,
  now,
}: Readonly<{
  attentionCount?: number;
  nearest?: StudentHomeworkSummary;
  now: number;
}>) {
  const user = useCurrentUserQuery();
  const firstName = user.data?.displayName.trim().split(/\s+/)[0];
  return (
    <header className="flex flex-col justify-between gap-5 px-1 py-5 sm:px-5 sm:py-7 lg:flex-row lg:items-center">
      <div className="min-w-0">
        {user.isPending && (
          <p className="text-2xl font-semibold text-slate-950" aria-busy="true">
            Загружаем профиль…
          </p>
        )}
        {user.isError && <DashboardError message="Не удалось загрузить профиль." retry={() => user.refetch()} />}
        {user.data && (
          <h1 className="break-words text-3xl font-bold tracking-tight text-slate-950 xl:text-4xl">
            Добрый день{firstName ? `, ${firstName}` : ""}!
          </h1>
        )}
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          {attentionCount !== undefined && attentionCount > 0
            ? `Задания, которые ждут тебя: ${attentionCount}. Продолжай обучение 💪`
            : "Продолжай обучение — здесь твои программы и ближайшие задания."}
        </p>
      </div>
      {nearest?.dueAt && (
        <Link
          href={`/student/homework/${nearest.id}`}
          className="flex min-w-0 items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/30 p-4 transition hover:border-blue-200 hover:bg-blue-50 lg:w-72 lg:shrink-0"
        >
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${isHomeworkOverdue(nearest, now) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}
          >
            <CalendarClock size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Ближайший срок</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatDashboardDeadline(nearest.dueAt, now)}</p>
            <p className="mt-1 break-words text-sm text-slate-500">{nearest.title}</p>
          </div>
        </Link>
      )}
    </header>
  );
}
