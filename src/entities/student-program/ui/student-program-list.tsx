import Link from "next/link";

import type { StudentProgramSummary } from "../api/student-program-queries";
import { formatProgramDate, programStatusLabels } from "../model/student-program-labels";

export function StudentProgramList({
  programs,
  studentId,
}: Readonly<{ programs: StudentProgramSummary[]; studentId: string }>) {
  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {programs.map((program) => (
        <li key={program.id}>
          <Link
            className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-neutral-50"
            href={`/teacher/students/${studentId}/programs/${program.id}`}
          >
            <span>
              <span className="block font-medium">{program.title}</span>
              <span className="mt-1 block text-sm text-neutral-600">
                {program.subject.name} · Начата {formatProgramDate(program.startedAt)}
              </span>
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
              {programStatusLabels[program.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
