import { ArrowRight, CircleAlert } from "lucide-react";
import Link from "next/link";

import type { TeacherDashboardAttentionItem } from "@/entities/dashboard";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TeacherAttention({ items }: Readonly<{ items: TeacherDashboardAttentionItem[] }>) {
  return (
    <section
      id="teacher-attention"
      className="scroll-mt-28 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <CircleAlert size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Требует внимания</h2>
          {items.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">Сейчас нет работ и отчётов, требующих действий.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {items.map((item) => {
                const presentation = getAttentionPresentation(item);

                return (
                  <li key={`${item.type}-${item.resourceId}`} className="py-4 first:pt-1 last:pb-0">
                    <Link
                      className="group flex items-center justify-between gap-4 rounded-2xl transition hover:bg-slate-50 sm:px-3 sm:py-2"
                      href={presentation.href}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900">{presentation.title}</span>
                        <span className="mt-1 block truncate text-sm text-slate-500">
                          {item.displayName} · {presentation.dateLabel} {dateFormatter.format(new Date(item.eventAt))}
                        </span>
                      </span>
                      <ArrowRight className="shrink-0 text-slate-300 transition group-hover:text-blue-600" size={17} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function getAttentionPresentation(item: TeacherDashboardAttentionItem) {
  switch (item.type) {
    case "SUBMISSION_NEEDS_REVIEW":
      return {
        title: "Работа ожидает проверки",
        dateLabel: "отправлено",
        href: item.navigation.homeworkId
          ? `/teacher/students/${item.studentId}/homework/${item.navigation.homeworkId}`
          : item.navigation.taskId
            ? `/teacher/tasks/${item.navigation.taskId}`
            : `/teacher/students/${item.studentId}`,
      };
    case "HOMEWORK_OVERDUE":
      return {
        title: "Просрочено домашнее задание",
        dateLabel: "срок истёк",
        href: item.navigation.homeworkId
          ? `/teacher/students/${item.studentId}/homework/${item.navigation.homeworkId}`
          : `/teacher/students/${item.studentId}/homework`,
      };
    case "LEARNING_PERIOD_REPORT_MISSING":
      return {
        title: "Отчётный период готов",
        dateLabel: "завершён",
        href: item.navigation.reportId
          ? `/teacher/students/${item.studentId}/reports/${item.navigation.reportId}`
          : `/teacher/students/${item.studentId}/reports`,
      };
  }
}
