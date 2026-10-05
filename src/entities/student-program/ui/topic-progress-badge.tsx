import { Check, Circle, CircleDot, LockKeyhole } from "lucide-react";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import type { TopicProgressStatus } from "../api/student-program-queries";
import { topicProgressPresentation } from "../model/student-program-labels";
const tones: Record<NonNullable<TopicProgressStatus>, BadgeTone> = {
  LOCKED: "neutral",
  AVAILABLE: "info",
  IN_PROGRESS: "info",
  COMPLETED: "success",
};
const icons = { LOCKED: LockKeyhole, AVAILABLE: Circle, IN_PROGRESS: CircleDot, COMPLETED: Check };
export function TopicProgressBadge({ status }: Readonly<{ status?: TopicProgressStatus | null }>) {
  if (!status) return <Badge>Статус не задан</Badge>;
  const Icon = icons[status];
  return (
    <Badge tone={tones[status]}>
      <Icon size={13} aria-hidden="true" />
      {topicProgressPresentation[status].label}
    </Badge>
  );
}
