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
    <section
      aria-labelledby="homework-history-heading"
      className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xs"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="homework-history-heading"
          className="flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-950"
        >
          <CircleCheck size={28} className="shrink-0 text-slate-400" aria-hidden="true" />
          История <span className="text-slate-500">· {visible.length}</span>
        </h2>
        {(homeworks.length > 3 || hasMore || expanded) && (
          <Button
            variant="ghost"
            className="gap-2 text-blue-600"
            aria-expanded={expanded}
            aria-controls="homework-history-list"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Свернуть" : "Показать все"} <ArrowRight size={15} aria-hidden="true" />
          </Button>
        )}
      </div>
      <ul id="homework-history-list" className="divide-y divide-slate-100 border-t border-slate-100">
        {visible.map((homework) => {
          const completed = homework.status === "COMPLETED";
          return (
            <li key={homework.id}>
              <Link
                href={`/student/homework/${homework.id}`}
                className="group flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:gap-5"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full ${completed ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"}`}
                >
                  {completed ? <Check size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1 break-words text-slate-900">{homework.title}</span>
                <StudentHomeworkStatusBadge state={completed ? "COMPLETED" : "CANCELLED"} />
                <ChevronRight
                  size={17}
                  className="hidden shrink-0 text-slate-400 group-hover:text-blue-600 sm:block"
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
