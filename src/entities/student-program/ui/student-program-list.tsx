import { BookOpenText, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { StudentProgramSummary } from "../api/student-program-queries";
import { formatProgramDate, programStatusLabels } from "../model/student-program-labels";

const statusClassNames: Record<StudentProgramSummary["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

export function StudentProgramList({
  programs,
  studentId,
}: Readonly<{
  programs: StudentProgramSummary[];
  studentId: string;
}>) {
  return (
    <ul className="grid gap-3">
      {programs.map((program) => (
        <li key={program.id}>
          <Link
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/20 sm:flex-row sm:items-center sm:justify-between"
            href={`/teacher/students/${studentId}/programs/${program.id}`}
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BookOpenText size={19} />
              </span>

              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-950">{program.title}</span>

                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{program.subject.name}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    Начата {formatProgramDate(program.startedAt)}
                  </span>
                </span>
              </span>
            </span>

            <span className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[program.status]}`}>
                {programStatusLabels[program.status]}
              </span>

              <ChevronRight
                size={18}
                className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
