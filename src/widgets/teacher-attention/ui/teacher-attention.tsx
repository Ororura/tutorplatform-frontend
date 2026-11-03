import { ArrowRight, Check, CircleAlert } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

import type { TeacherDashboardAttentionItem } from "@/entities/dashboard";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TeacherAttention({ items }: Readonly<{ items: TeacherDashboardAttentionItem[] }>) {
  if (items.length === 0) {
    return (
      <section
        id="teacher-attention"
        className="flex scroll-mt-20 items-start gap-3 rounded-xl border border-border bg-card p-6"
      >
        <Check aria-hidden="true" className="mt-0.5 shrink-0 text-foreground-muted" size={20} />
        <div>
          <h2 className="section-title text-sm">Всё спокойно</h2>
          <p className="mt-1 text-sm text-(--text-secondary)">Сейчас нет работ и отчётов, требующих действий.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="teacher-attention" className="scroll-mt-20" aria-labelledby="attention-heading">
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <CardTitle id="attention-heading">Требует внимания</CardTitle>
          <Badge tone="warning">{items.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const presentation = getAttentionPresentation(item);
              return (
                <li key={`${item.type}-${item.resourceId}`}>
                  <Link
                    className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-accent"
                    href={presentation.href}
                  >
                    <CircleAlert
                      size={18}
                      aria-hidden="true"
                      className={`mt-0.5 shrink-0 ${item.type === "HOMEWORK_OVERDUE" ? "text-danger" : "text-warning"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{presentation.title}</span>
                      <span className="mt-1 block wrap-break-word text-xs leading-5 text-muted-foreground">
                        {item.displayName} · {presentation.dateLabel} {dateFormatter.format(new Date(item.eventAt))}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
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
