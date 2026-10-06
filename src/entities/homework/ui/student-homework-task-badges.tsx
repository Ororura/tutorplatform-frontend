import { SubmissionStatusBadge } from "@/entities/submission";
import { taskTypePresentation } from "@/entities/task";

import type { StudentHomeworkItem } from "../api/student-homework-queries";

const typeLabels: Readonly<Record<string, string>> = { ...taskTypePresentation, TEXT: "Текст" };

export function StudentHomeworkTaskBadges({ item }: Readonly<{ item: StudentHomeworkItem }>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="badge bg-surface-subtle text-foreground-muted">
        {typeLabels[item.task.taskType] ?? item.task.taskType}
      </span>
      <span className="badge bg-surface-subtle text-foreground-muted">
        {item.required ? "Обязательное" : "Дополнительное"}
      </span>
      <SubmissionStatusBadge status={item.passed ? "PASSED" : item.latestSubmissionStatus} />
    </div>
  );
}
