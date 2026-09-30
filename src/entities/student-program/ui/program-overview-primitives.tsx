import { BookOpenText } from "lucide-react";

import { getTopicCompletion, type CurrentProgress } from "@/entities/progress";
import { cn } from "@/shared/lib/cn";
import { ProgressBar } from "@/shared/ui/progress-bar";

import type { StudentProgramSummary } from "../api/student-program-queries";
import { programStatusLabels } from "../model/student-program-labels";

export function ProgramStatusBadge({ status }: Readonly<{ status: StudentProgramSummary["status"] }>) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-lg px-2 py-1 text-xs font-medium",
        status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
      )}
    >
      {programStatusLabels[status]}
    </span>
  );
}

export function ProgramIcon({ large = false }: Readonly<{ large?: boolean }>) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600",
        large ? "size-14 sm:size-16" : "size-12",
      )}
    >
      <BookOpenText size={large ? 28 : 23} aria-hidden="true" />
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
          "mb-2 flex flex-wrap items-center justify-between gap-2 font-medium text-slate-600",
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
