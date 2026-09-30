import { ChevronRight, Code2, FileText } from "lucide-react";
import Link from "next/link";

import type { Subject, Task, TaskStatus } from "../api/task-queries";
import { taskDifficultyPresentation, taskStatusPresentation, taskTypePresentation } from "../model/task-presentation";

const statusClassNames: Record<TaskStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

export function TaskList({
  tasks,
  subjects,
}: Readonly<{
  tasks: Task[];
  subjects: Subject[];
}>) {
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));

  return (
    <ul className="divide-y divide-(--border) border-y">
      {tasks.map((task) => {
        const TypeIcon = task.taskType === "CODE" ? Code2 : FileText;

        return (
          <li key={task.id}>
            <Link
              className="group flex flex-col gap-3 px-3 py-4 transition hover:bg-white/80 focus-visible:-outline-offset-2 sm:flex-row sm:items-center"
              href={`/teacher/tasks/${task.id}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-(--text-secondary)">
                  <TypeIcon size={19} />
                </span>

                <span className="min-w-0">
                  <span className="block wrap-break-word font-semibold text-slate-900">{task.title}</span>

                  <span className="mt-1 block wrap-break-word text-sm text-(--text-secondary)">
                    {subjectNames.get(task.subjectId) ?? "Без предмета"}
                  </span>
                </span>
              </span>

              <span className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {taskTypePresentation[task.taskType]}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {taskDifficultyPresentation[task.difficulty]}
                </span>

                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[task.status]}`}>
                  {taskStatusPresentation[task.status]}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600">
                Открыть
                <ChevronRight size={17} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
