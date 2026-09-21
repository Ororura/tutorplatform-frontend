import { CalendarClock, ChevronRight, ListChecks } from "lucide-react";
import Link from "next/link";

import type { StudentHomeworkSummary } from "../api/student-homework-queries";
import { formatHomeworkDate } from "../model/homework-presentation";
import {
  getStudentHomeworkPresentationState,
  studentHomeworkStatusPresentation,
  type StudentHomeworkPresentationState,
} from "../model/student-homework-presentation";

function getStatusClassName(state: StudentHomeworkPresentationState) {
  switch (state) {
    case "OVERDUE":
      return "bg-red-50 text-red-700";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export function StudentHomeworkList({ homeworks }: Readonly<{ homeworks: StudentHomeworkSummary[] }>) {
  return (
    <ul className="divide-y divide-slate-100">
      {homeworks.map((homework) => {
        const state = getStudentHomeworkPresentationState(homework);

        return (
          <li key={homework.id}>
            <Link
              className="group flex flex-col gap-4 px-2 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
              href={`/student/homework/${homework.id}`}
            >
              <span className="flex min-w-0 flex-1 items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ListChecks size={19} aria-hidden="true" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950">{homework.title}</span>

                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm leading-6 text-slate-500">
                    <CalendarClock size={14} aria-hidden="true" />
                    Назначено {formatHomeworkDate(homework.assignedAt)}
                    <span aria-hidden="true">·</span>
                    {homework.dueAt ? `срок ${formatHomeworkDate(homework.dueAt)}` : "без срока"}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    Заданий: {homework.itemsCount}
                    {homework.completedAt ? ` · Выполнено ${formatHomeworkDate(homework.completedAt)}` : ""}
                  </span>
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClassName(state)}`}>
                  {studentHomeworkStatusPresentation[state]}
                </span>

                <ChevronRight
                  size={18}
                  className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
