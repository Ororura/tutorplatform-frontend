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
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        {user.isPending && (
          <p className="text-2xl font-semibold text-foreground" aria-busy="true">
            Загружаем профиль…
          </p>
        )}
        {user.isError && <DashboardError message="Не удалось загрузить профиль." retry={() => user.refetch()} />}
        {user.data && <h1 className="page-title wrap-break-word">Добрый день{firstName ? `, ${firstName}` : ""}!</h1>}
        <p className="page-description mt-2">
          {attentionCount !== undefined && attentionCount > 0
            ? `Задания, которые ждут тебя: ${attentionCount}. Продолжай обучение.`
            : "Продолжай обучение — здесь твои программы и ближайшие задания."}
        </p>
      </div>
      {nearest?.dueAt && (
        <Link
          href={`/student/homework/${nearest.id}`}
          className="flex min-w-0 items-center gap-4 rounded-surface border border-primary-border bg-primary-subtle/30 p-4 transition hover:border-primary-border hover:bg-primary-subtle lg:w-64 lg:shrink-0"
        >
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-surface ${isHomeworkOverdue(nearest, now) ? "bg-danger-subtle text-danger" : "bg-primary-subtle text-primary"}`}
          >
            <CalendarClock size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-foreground-muted">Ближайший срок</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{formatDashboardDeadline(nearest.dueAt, now)}</p>
            <p className="mt-1 wrap-break-word text-sm text-foreground-muted">{nearest.title}</p>
          </div>
        </Link>
      )}
    </header>
  );
}
