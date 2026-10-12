"use client";

import { SubmissionStatusBadge, type TeacherSubmission } from "@/entities/submission";
import { Button } from "@/shared/ui/button";
import { useReviewTextSubmissionMutation } from "../api/review-text-submission";

export function TextSubmissionReview({
  studentId,
  submission,
  review,
}: Readonly<{
  studentId: string;
  submission: TeacherSubmission;
  review: ReturnType<typeof useReviewTextSubmissionMutation>;
}>) {
  const isCurrentSubmission = review.variables?.submissionId === submission.id;

  const saved = review.isSuccess && isCurrentSubmission;
  const currentSubmission = saved && review.data ? review.data : submission;
  const reviewing = review.isPending && isCurrentSubmission;

  return (
    <section
      className="space-y-3 rounded-control border border-border bg-surface-subtle p-4"
      aria-label="Ответ ученика"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Ответ ученика</h3>

        <div className="flex items-center gap-2">
          <SubmissionStatusBadge status={currentSubmission.status} />

          <span className="text-xs text-foreground-muted">Попытка {submission.attemptNo}</span>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm">{submission.textAnswer}</p>

      {saved && (
        <p className="text-sm text-success" role="status">
          {review.data?.status === "PASSED" ? "Решение принято." : "Решение отклонено."} Изменения сохранены.
        </p>
      )}
      {currentSubmission.status === "NEEDS_REVIEW" && (
        <div className="space-y-3 border-t pt-3 border-border">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={review.isPending}
              type="button"
              onClick={() =>
                review.mutate({
                  studentId,
                  submissionId: submission.id,
                  status: "PASSED",
                })
              }
            >
              {reviewing && review.variables?.status === "PASSED" ? "Принимаем…" : "Принять"}
            </Button>

            <Button
              variant="danger"
              disabled={review.isPending}
              type="button"
              onClick={() =>
                review.mutate({
                  studentId,
                  submissionId: submission.id,
                  status: "FAILED",
                })
              }
            >
              {reviewing && review.variables?.status === "FAILED" ? "Отклоняем…" : "Не принять"}
            </Button>
          </div>
        </div>
      )}
      {review.isError && isCurrentSubmission && (
        <p className="text-sm text-danger" role="alert">
          Не удалось проверить решение. Обновите данные и попробуйте ещё раз.
        </p>
      )}
    </section>
  );
}
