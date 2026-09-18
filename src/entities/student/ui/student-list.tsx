import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { StudentSummary } from "../api/student-queries";
import { getStudentAccountStatusLabel, getStudentStatusLabel } from "../lib/student-labels";

function getStudentInitials(student: StudentSummary) {
  return `${student.firstName[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase();
}

export function StudentList({
  students,
}: Readonly<{
  students: StudentSummary[];
}>) {
  return (
    <ul className="divide-y divide-slate-100">
      {students.map((student) => (
        <li key={student.id}>
          <Link
            className="group grid gap-4 px-1 py-5 transition first:pt-2 last:pb-2 hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:px-3"
            href={`/teacher/students/${student.id}`}
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
                {getStudentInitials(student)}
              </span>

              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-900">
                  {student.firstName} {student.lastName ?? ""}
                </span>

                <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <CalendarDays size={14} />
                  Добавлен {new Date(student.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </span>
            </span>

            <span className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {getStudentStatusLabel(student.status)}
              </span>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {getStudentAccountStatusLabel(student.accountStatus)}
              </span>
            </span>

            <span className="flex items-center gap-2 text-sm font-medium text-blue-600">
              Открыть
              <ChevronRight size={17} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
