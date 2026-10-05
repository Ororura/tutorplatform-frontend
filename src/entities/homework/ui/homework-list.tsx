import { CalendarClock, ChevronRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import type { HomeworkSummary } from "../api/homework-queries";
import {
  formatHomeworkDate,
  getHomeworkPresentationState,
  homeworkStatusPresentation,
} from "../model/homework-presentation";

function getStatusClassName(state: ReturnType<typeof getHomeworkPresentationState>) {
  switch (state) {
    case "OVERDUE":
      return "bg-danger-subtle text-danger";
    case "COMPLETED":
      return "bg-success-subtle text-success";
    case "CANCELLED":
      return "bg-surface-subtle text-foreground-muted";
    default:
      return "bg-primary-subtle text-primary";
  }
}

export function HomeworkList({
  homeworks,
  studentId,
}: Readonly<{
  homeworks: HomeworkSummary[];
  studentId: string;
}>) {
  return (
    <ul className="divide-y divide-border">
      {homeworks.map((homework) => {
        const state = getHomeworkPresentationState(homework);

        return (
          <li key={homework.id}>
            <Link
              className="group flex flex-col gap-4 px-2 py-5 transition hover:bg-surface-subtle/70 sm:flex-row sm:items-center"
              href={`/teacher/students/${studentId}/homework/${homework.id}`}
            >
              <span className="flex min-w-0 flex-1 items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
                  <ClipboardCheck size={19} />
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{homework.title}</span>

                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-foreground-muted">
                    <CalendarClock size={14} />
                    Назначено {formatHomeworkDate(homework.assignedAt)}
                    <span aria-hidden="true">·</span>
                    {homework.dueAt ? `срок ${formatHomeworkDate(homework.dueAt)}` : "без срока"}
                  </span>
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-3">
                <span className={`badge  ${getStatusClassName(state)}`}>{homeworkStatusPresentation[state]}</span>

                <ChevronRight
                  size={18}
                  className="text-foreground-subtle transition group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
