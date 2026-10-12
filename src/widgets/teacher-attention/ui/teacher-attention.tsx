"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  getAttentionPresentation,
  sortAttentionItems,
  type AttentionType,
  type TeacherDashboardAttentionItem,
} from "@/entities/dashboard";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/feedback";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" });
const filters: { value?: AttentionType; label: string }[] = [
  { label: "Все" },
  { value: "SUBMISSION_NEEDS_REVIEW", label: "На проверку" },
  { value: "HOMEWORK_OVERDUE", label: "Просрочено" },
  { value: "LEARNING_PERIOD_REPORT_MISSING", label: "Отчёты" },
];

type Props = {
  items: TeacherDashboardAttentionItem[];
  filter?: AttentionType;
  onFilterChange?: (filter?: AttentionType) => void;
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
};

export function TeacherAttention({
  items,
  filter,
  onFilterChange,
  isPending,
  isError,
  onRetry,
  page = 0,
  totalPages = 1,
  totalElements,
  onPageChange,
}: Readonly<Props>) {
  const visibleItems = sortAttentionItems(items).filter((item) => filter === undefined || item.type === filter);
  return (
    <section
      id="teacher-attention"
      aria-labelledby="work-queue-heading"
      className="surface scroll-mt-[calc(var(--app-header-height)+1rem)]"
    >
      <h2 id="work-queue-heading" className="section-title">
        Рабочая очередь
      </h2>
      <p className="mt-1 text-sm text-foreground-muted">Проверки, просроченные задания и готовые отчётные периоды.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Фильтр рабочей очереди">
        {filters.map((option) => (
          <Button
            key={option.label}
            type="button"
            variant={filter === option.value ? "primary" : "secondary"}
            aria-pressed={filter === option.value}
            onClick={() => onFilterChange?.(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="mt-4">
        {isPending ? (
          <LoadingState>Загружаем рабочую очередь…</LoadingState>
        ) : isError ? (
          <ErrorState title="Не удалось загрузить рабочую очередь" onRetry={onRetry} />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={filter ? "В этой категории нет задач" : "Всё спокойно"}
            description="Сейчас нет действий в выбранной очереди."
          />
        ) : (
          <ul className="divide-y divide-border">
            {visibleItems.map((item) => {
              const presentation = getAttentionPresentation(item);
              return (
                <li key={`${item.type}-${item.resourceId}`} className="py-2">
                  <Link
                    className="group flex min-h-(--control-height) items-center justify-between gap-4 rounded-control py-2 hover:bg-surface-subtle sm:px-3"
                    href={presentation.href}
                  >
                    <span className="min-w-0 wrap-break-word">
                      <span className="block font-medium text-foreground">{item.displayName}</span>
                      <span className="mt-1 block text-sm">
                        {presentation.title}
                        {presentation.detail ? ` · ${presentation.detail}` : ""}
                      </span>
                      <span className="mt-1 block text-sm text-foreground-muted">
                        {presentation.dateLabel} {dateFormatter.format(new Date(item.eventAt))}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="shrink-0 text-foreground-subtle group-hover:text-primary"
                      size={17}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!isPending && !isError && totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-3" aria-label="Страницы рабочей очереди">
          <Button type="button" variant="secondary" disabled={page === 0} onClick={() => onPageChange?.(page - 1)}>
            Назад
          </Button>
          <p className="text-sm text-foreground-muted">
            Страница {page + 1} из {totalPages}
            {totalElements !== undefined ? ` · Всего ${totalElements}` : ""}
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            Вперёд
          </Button>
        </nav>
      )}
    </section>
  );
}
