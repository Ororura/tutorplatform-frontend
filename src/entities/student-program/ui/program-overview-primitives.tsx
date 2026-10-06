import { BookOpenText } from "lucide-react";

import { getTopicCompletion, type CurrentProgress } from "@/entities/progress";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { ProgressBar } from "@/shared/ui/progress-bar";

import type { StudentProgramSummary } from "../api/student-program-queries";
import { programStatusLabels } from "../model/student-program-labels";

export function ProgramStatusBadge({ status }: Readonly<{ status: StudentProgramSummary["status"] }>) {
  return (
    <Badge
      tone={status === "ACTIVE" || status === "COMPLETED" ? "success" : status === "PAUSED" ? "warning" : "neutral"}
    >
      {programStatusLabels[status]}
    </Badge>
  );
}

export function ProgramIcon({ large = false }: Readonly<{ large?: boolean }>) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-inset bg-surface-subtle text-foreground-muted",
        large ? "size-11" : "size-10",
      )}
    >
      <BookOpenText size={large ? 24 : 20} aria-hidden="true" />
    </span>
  );
}

export function ProgramTopicProgress({
  progress,
  title,
  compact = false,
}: Readonly<{ progress?: CurrentProgress; title: string; compact?: boolean }>) {
  const completion = getTopicCompletion(progress);
  if (!completion) return null;
  return (
    <div>
      <div
        className={cn(
          "mb-2 flex flex-wrap items-center justify-between gap-2 font-medium text-foreground-muted",
          compact ? "text-xs" : "text-sm",
        )}
      >
        <span>
          {completion.completed} из {completion.total} тем{compact ? "" : " пройдено"}
        </span>
        <span className="tabular-nums">{completion.percent}%</span>
      </div>
      <ProgressBar value={completion.percent} label={`Прогресс: ${title}`} />
    </div>
  );
}
