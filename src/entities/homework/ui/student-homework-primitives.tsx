import { ListChecks } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import {
  studentHomeworkStatusPresentation,
  type StudentHomeworkPresentationState,
} from "../model/student-homework-presentation";

export function StudentHomeworkIcon() {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:size-14">
      <ListChecks size={24} aria-hidden="true" />
    </span>
  );
}

export function StudentHomeworkStatusBadge({ state }: Readonly<{ state: StudentHomeworkPresentationState }>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-lg px-3 py-1 text-xs font-medium",
        state === "OVERDUE"
          ? "bg-red-50 text-red-700"
          : state === "COMPLETED"
            ? "bg-emerald-50 text-emerald-700"
            : state === "CANCELLED"
              ? "bg-slate-100 text-slate-600"
              : "bg-blue-50 text-blue-700",
      )}
    >
      {studentHomeworkStatusPresentation[state]}
    </span>
  );
}
