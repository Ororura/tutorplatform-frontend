import { PageHeader } from "@/shared/ui/page-header";
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
    <PageHeader
      title={user.data ? `Добрый день${firstName ? `, ${firstName}` : ""}!` : "Главная"}
      description={
        attentionCount !== undefined && attentionCount > 0
          ? `Задания, которые ждут тебя: ${attentionCount}. Продолжай обучение.`
          : "Продолжай обучение — здесь твои программы и ближайшие задания."
      }
      details={
        user.isPending ? (
          <p aria-busy="true">Загружаем профиль…</p>
        ) : (
          user.isError && <DashboardError message="Не удалось загрузить профиль." retry={() => user.refetch()} />
        )
      }
      actions={
        nearest?.dueAt && (
          <Link
            href={`/student/homework/${nearest.id}`}
            className="surface surface-interactive flex min-w-0 max-w-full items-center gap-3 p-4 md:w-72"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-inset ${isHomeworkOverdue(nearest, now) ? "bg-danger-subtle text-danger" : "bg-primary-subtle text-primary"}`}
            >
              <CalendarClock size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-foreground-muted">Ближайший срок</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatDashboardDeadline(nearest.dueAt, now)}
              </p>
              <p className="mt-1 wrap-anywhere text-sm text-foreground-muted">{nearest.title}</p>
            </div>
          </Link>
        )
      }
    />
  );
}
