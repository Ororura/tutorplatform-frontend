import { ChevronRight, Code2, FileText } from "lucide-react";
import Link from "next/link";

import type { Subject, Task } from "../api/task-queries";
import { taskDifficultyPresentation, taskStatusPresentation, taskTypePresentation } from "../model/task-presentation";

export function TaskList({
  tasks,
  subjects,
}: Readonly<{
  tasks: Task[];
  subjects: Subject[];
}>) {
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((task) => {
        const TypeIcon = task.taskType === "CODE" ? Code2 : FileText;

        return (
          <li key={task.id}>
            <Link
              className="group flex flex-col gap-4 px-2 py-5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
              href={`/teacher/tasks/${task.id}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <TypeIcon size={19} />
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{task.title}</span>

                  <span className="mt-1 block text-sm text-slate-500">
                    {subjectNames.get(task.subjectId) ?? "Без предмета"}
                  </span>
                </span>
              </span>

              <span className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {taskTypePresentation[task.taskType]}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {taskDifficultyPresentation[task.difficulty]}
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
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
