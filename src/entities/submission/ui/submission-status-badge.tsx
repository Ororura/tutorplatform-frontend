import { cn } from "@/shared/lib/cn";

import { submissionStatusPresentation, type SubmissionStatus } from "../model/submission-presentation";

export function SubmissionStatusBadge({ status }: Readonly<{ status?: SubmissionStatus | null }>) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        status === "PASSED"
          ? "bg-emerald-50 text-emerald-700"
          : status === "FAILED" || status === "SYSTEM_ERROR"
            ? "bg-red-50 text-red-700"
            : status
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-100 text-slate-600",
      )}
    >
      {status ? submissionStatusPresentation[status] : "Не выполнено"}
    </span>
  );
}
