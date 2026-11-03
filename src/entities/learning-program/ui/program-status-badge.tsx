import type { LearningProgramStatus } from "../api/learning-program-queries";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
const presentation: Record<LearningProgramStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Черновик", tone: "warning" },
  ACTIVE: { label: "Активна", tone: "success" },
  ARCHIVED: { label: "В архиве", tone: "neutral" },
};
export function LearningProgramStatusBadge({ status }: Readonly<{ status: LearningProgramStatus }>) {
  return <Badge tone={presentation[status].tone}>{presentation[status].label}</Badge>;
}
