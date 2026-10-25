"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { teacherSubmissionQueries, submissionStatusPresentation, type TeacherSubmission } from "@/entities/submission";
import { useReviewTextSubmissionMutation } from "../api/review-text-submission";
import { Textarea } from "@/shared/ui/form-controls";
import { parseWebFiles } from "@/shared/lib/web-exercise";
import { WebFilesEditor } from "@/shared/ui/web-files-editor";
import { Button } from "@/shared/ui/button";

export function SubmissionReview({
  studentId,
  submission,
  review,
}: Readonly<{
  studentId: string;
  submission: TeacherSubmission;
  review: ReturnType<typeof useReviewTextSubmissionMutation>;
}>) {
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const detail = useQuery({
    ...teacherSubmissionQueries.detail(studentId, submission.id),
    enabled: expanded && !!submission.execution,
  });
  const sourceCode = detail.data?.sourceCode ?? submission.sourceCode;
  const webFiles = parseWebFiles(sourceCode);
  const isCurrentSubmission = review.variables?.submissionId === submission.id;

  const reviewing = review.isPending && isCurrentSubmission;

  return (
    <section
      className="ml-8 space-y-3 rounded-control border border-border bg-surface-subtle p-4"
      aria-label="Ответ ученика"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Ответ ученика</h3>

        <div className="flex items-center gap-2">
          <SubmissionStatus status={submission.status} />

          <span className="text-xs text-foreground-muted">Попытка {submission.attemptNo}</span>
        </div>
      </div>

      {submission.execution ? (
        <div className="space-y-3">
          <Button type="button" variant="secondary" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Скрыть решение" : "Открыть код и предпросмотр"}
          </Button>
          {expanded &&
            (detail.isPending ? (
              <p aria-busy="true">Загружаем код…</p>
            ) : detail.isError ? (
              <p role="alert">Не удалось загрузить код.</p>
            ) : webFiles ? (
              <WebFilesEditor files={webFiles} editableFiles={[]} disabled />
            ) : (
              <pre className="overflow-auto whitespace-pre-wrap text-xs">{sourceCode}</pre>
            ))}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm">{submission.textAnswer}</p>
      )}
      {submission.execution && (
        <p className="text-sm">
          Автопроверка:{" "}
          {submission.execution.status === "SKIPPED"
            ? "не требуется"
            : `${submission.execution.passedTests} из ${submission.execution.totalTests}`}
        </p>
      )}
      {submission.reviewComment && (
        <p className="whitespace-pre-wrap text-sm">Комментарий: {submission.reviewComment}</p>
      )}

      {submission.status === "NEEDS_REVIEW" && (
        <div className="space-y-3 border-t pt-3 border-border">
          <label className="block space-y-2 text-sm">
            Комментарий преподавателя
            <Textarea
              maxLength={4000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={review.isPending}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={review.isPending}
              type="button"
              onClick={() =>
                review.mutate({
                  studentId,
                  submissionId: submission.id,
                  status: "PASSED",
                  ...(comment.trim() ? { comment: comment.trim() } : {}),
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
                  ...(comment.trim() ? { comment: comment.trim() } : {}),
                })
              }
            >
              {reviewing && review.variables?.status === "FAILED" ? "Отклоняем…" : "Не принять"}
            </Button>
          </div>

          {review.isError && isCurrentSubmission && (
            <p className="text-sm text-danger" role="alert">
              Не удалось проверить решение. Попробуйте ещё раз.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function SubmissionStatus({
  status,
}: Readonly<{
  status: TeacherSubmission["status"];
}>) {
  const label = submissionStatusPresentation[status] ?? status;

  switch (status) {
    case "NEEDS_REVIEW":
      return <span className="badge bg-warning-subtle text-warning">Ожидает проверки</span>;

    case "PASSED":
      return <span className="badge bg-success-subtle text-success">Принято</span>;

    case "FAILED":
      return <span className="badge bg-danger-subtle text-danger">Не принято</span>;

    default:
      return <span className="badge bg-surface-subtle">{label}</span>;
  }
}
