import Link from "next/link";

import type { StudentSummary } from "../api/student-queries";
import { getStudentAccountStatusLabel, getStudentStatusLabel } from "../lib/student-labels";

export function StudentList({ students }: Readonly<{ students: StudentSummary[] }>) {
  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {students.map((student) => (
        <li key={student.id}>
          <Link
            className="flex flex-col gap-2 p-4 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:flex-row sm:items-center sm:justify-between"
            href={`/teacher/students/${student.id}`}
          >
            <span>
              <span className="font-medium">
                {student.firstName} {student.lastName ?? ""}
              </span>
              <span className="mt-1 block text-sm text-neutral-500">
                Добавлен {new Date(student.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </span>
            <span className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                {getStudentStatusLabel(student.status)}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                {getStudentAccountStatusLabel(student.accountStatus)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
