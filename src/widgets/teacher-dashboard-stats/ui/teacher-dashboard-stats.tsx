import { ArrowRight, ClipboardCheck, FileChartColumnIncreasing, TimerOff, UsersRound } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import type { TeacherDashboard } from "@/entities/dashboard";

type Props = {
  data: TeacherDashboard;
};

type DashboardCard = {
  label: string;
  value: number;
  href: string;
  icon: ComponentType<{ size?: number }>;
  iconClassName: string;
};

export function TeacherDashboardStats({ data }: Readonly<Props>) {
  const cards: DashboardCard[] = [
    {
      label: "Активные ученики",
      value: data.activeStudentsCount,
      href: "/teacher/students",
      icon: UsersRound,
      iconClassName: "bg-surface-hover text-foreground-muted",
    },
    {
      label: "Ожидают проверки",
      value: data.needsReviewSubmissionsCount,
      href: "#teacher-attention",
      icon: ClipboardCheck,
      iconClassName: "bg-warning-subtle text-warning",
    },
    {
      label: "Просроченные задания",
      value: data.overdueHomeworksCount,
      href: "#teacher-attention",
      icon: TimerOff,
      iconClassName: "bg-danger-subtle text-danger",
    },
    {
      label: "Готовые отчётные периоды",
      value: data.completedLearningPeriodsWithoutPublishedReportCount,
      href: "#teacher-attention",
      icon: FileChartColumnIncreasing,
      iconClassName: "bg-success-subtle text-success",
    },
  ];

  return (
    <section
      aria-label="Сводка преподавателя"
      className="grid grid-cols-2 gap-2 border-b border-border pb-4 xl:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.label}
            className="group rounded-control p-3 transition-colors hover:bg-surface-hover"
            href={card.href}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex size-8 items-center justify-center rounded-inset ${card.iconClassName}`}>
                <Icon size={17} aria-hidden="true" />
              </span>
              <ArrowRight
                className="text-foreground-subtle transition group-hover:text-primary"
                size={17}
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{card.value}</p>
            <p className="mt-1 text-sm leading-5 text-(--text-secondary)">{card.label}</p>
          </Link>
        );
      })}
    </section>
  );
}
