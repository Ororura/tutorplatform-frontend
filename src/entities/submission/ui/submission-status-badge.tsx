import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { submissionStatusPresentation, type SubmissionStatus } from "../model/submission-presentation";
const tones: Record<SubmissionStatus, BadgeTone> = {
  SUBMITTED: "info",
  PASSED: "success",
  FAILED: "danger",
  NEEDS_REVIEW: "warning",
  SYSTEM_ERROR: "danger",
};
export function SubmissionStatusBadge({ status }: Readonly<{ status?: SubmissionStatus | null }>) {
  return (
    <Badge tone={status ? tones[status] : "neutral"}>
      {status ? submissionStatusPresentation[status] : "Не выполнено"}
    </Badge>
  );
}
