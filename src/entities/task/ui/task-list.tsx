import Link from "next/link";

import type { Subject, Task } from "../api/task-queries";
import { taskDifficultyPresentation, taskStatusPresentation, taskTypePresentation } from "../model/task-presentation";

export function TaskList({ tasks, subjects }: Readonly<{ tasks: Task[]; subjects: Subject[] }>) {
  const subjectNames = new Map(subjects.map((subject) => [subject.id, subject.name]));
  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link className="block space-y-2 p-4 transition hover:bg-neutral-50" href={`/teacher/tasks/${task.id}`}>
            <span className="font-medium">{task.title}</span>
            <span className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                {taskTypePresentation[task.taskType]}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1">
                {taskDifficultyPresentation[task.difficulty]}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1">{taskStatusPresentation[task.status]}</span>
              {subjectNames.get(task.subjectId) && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1">{subjectNames.get(task.subjectId)}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
