import { ListChecks } from "lucide-react";

import { Badge, type BadgeTone } from "@/shared/ui/badge";

import {
  studentHomeworkStatusPresentation,
  type StudentHomeworkPresentationState,
} from "../model/student-homework-presentation";

export function StudentHomeworkIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-inset bg-primary-subtle text-primary">
      <ListChecks size={20} aria-hidden="true" />
    </span>
  );
}

export function StudentHomeworkStatusBadge({ state }: Readonly<{ state: StudentHomeworkPresentationState }>) {
  const tone: BadgeTone =
    state === "OVERDUE" ? "danger" : state === "COMPLETED" ? "success" : state === "CANCELLED" ? "neutral" : "info";
  return <Badge tone={tone}>{studentHomeworkStatusPresentation[state]}</Badge>;
}
