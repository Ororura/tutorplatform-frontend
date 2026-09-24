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
      iconClassName: "bg-blue-50 text-blue-700",
    },
    {
      label: "Ожидают проверки",
      value: data.needsReviewSubmissionsCount,
      href: "#teacher-attention",
      icon: ClipboardCheck,
      iconClassName: "bg-violet-50 text-violet-700",
    },
    {
      label: "Просроченные задания",
      value: data.overdueHomeworksCount,
      href: "#teacher-attention",
      icon: TimerOff,
      iconClassName: "bg-red-50 text-red-700",
    },
    {
      label: "Готовые отчётные периоды",
      value: data.completedLearningPeriodsWithoutPublishedReportCount,
      href: "#teacher-attention",
      icon: FileChartColumnIncreasing,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <section aria-label="Сводка преподавателя" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.label}
            className="group rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] transition hover:-translate-y-0.5 hover:border-blue-100"
            href={card.href}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex size-10 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                <Icon size={19} />
              </span>
              <ArrowRight className="text-slate-300 transition group-hover:text-blue-600" size={17} />
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">{card.label}</p>
          </Link>
        );
      })}
    </section>
  );
}
