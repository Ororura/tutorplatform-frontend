import { ArrowRight, Check, ChevronRight, CircleCheck, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StudentHomeworkStatusBadge, type StudentHomeworkSummary } from "@/entities/homework";
import { Button } from "@/shared/ui/button";

export function StudentHomeworkHistory({
  homeworks,
  hasMore,
  loading,
  loadMore,
}: Readonly<{
  homeworks: StudentHomeworkSummary[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? homeworks : homeworks.slice(0, 3);
  return (
    <section aria-labelledby="homework-history-heading" className="surface">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="homework-history-heading" className="section-title flex items-center gap-3">
          <CircleCheck size={28} className="shrink-0 text-foreground-subtle" aria-hidden="true" />
          История <span className="text-foreground-muted">· {visible.length}</span>
        </h2>
        {(homeworks.length > 3 || hasMore || expanded) && (
          <Button
            variant="ghost"
            className="gap-2 text-primary"
            aria-expanded={expanded}
            aria-controls="homework-history-list"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Свернуть" : "Показать все"} <ArrowRight size={15} aria-hidden="true" />
          </Button>
        )}
      </div>
      <ul id="homework-history-list" className="divide-y divide-border border-t border-border">
        {visible.map((homework) => {
          const completed = homework.status === "COMPLETED";
          return (
            <li key={homework.id}>
              <Link
                href={`/student/homework/${homework.id}`}
                className="group flex min-h-11 items-center gap-3 rounded-inset px-2 py-2 text-sm transition hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:gap-5"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ${completed ? "bg-success text-primary-foreground" : "bg-surface-hover text-foreground-muted"}`}
                >
                  {completed ? <Check size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1 wrap-break-word text-foreground">{homework.title}</span>
                <StudentHomeworkStatusBadge state={completed ? "COMPLETED" : "CANCELLED"} />
                <ChevronRight
                  size={17}
                  className="hidden shrink-0 text-foreground-subtle group-hover:text-primary sm:block"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
      {expanded && hasMore && (
        <Button variant="secondary" className="mt-3 w-full sm:w-auto" disabled={loading} onClick={loadMore}>
          {loading ? "Загружаем…" : "Загрузить ещё"}
        </Button>
      )}
    </section>
  );
}
