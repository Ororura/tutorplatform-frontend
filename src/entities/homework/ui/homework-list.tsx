import Link from "next/link";

import type { HomeworkSummary } from "../api/homework-queries";
import { formatHomeworkDate, getHomeworkPresentationState, homeworkStatusPresentation } from "../model/homework-presentation";

export function HomeworkList({ homeworks, studentId }: Readonly<{ homeworks: HomeworkSummary[]; studentId: string }>) {
  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {homeworks.map((homework) => {
        const state = getHomeworkPresentationState(homework);
        return (
          <li key={homework.id}>
            <Link className="flex flex-col gap-2 p-4 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between" href={`/teacher/students/${studentId}/homework/${homework.id}`}>
              <span><span className="font-medium">{homework.title}</span><span className="mt-1 block text-sm text-neutral-500">Назначено {formatHomeworkDate(homework.assignedAt)}{homework.dueAt ? ` · срок ${formatHomeworkDate(homework.dueAt)}` : " · без срока"}</span></span>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs ${state === "OVERDUE" ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-700"}`}>{homeworkStatusPresentation[state]}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
