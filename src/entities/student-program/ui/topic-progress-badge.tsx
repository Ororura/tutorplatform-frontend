import { cn } from "@/shared/lib/cn";

import type { TopicProgressStatus } from "../api/student-program-queries";
import { topicProgressPresentation } from "../model/student-program-labels";

export function TopicProgressBadge({ status }: Readonly<{ status?: TopicProgressStatus | null }>) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
        <span aria-hidden="true">—</span> Статус не задан
      </span>
    );
  }

  const presentation = topicProgressPresentation[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", presentation.className)}>
      <span aria-hidden="true">{presentation.icon}</span> {presentation.label}
    </span>
  );
}
