"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { dashboardQueries, getAttentionPresentation } from "@/entities/dashboard";
import { Button, buttonClassName } from "@/shared/ui/button";
import { studentQueries } from "@/entities/student";
import { teacherSubmissionQueries } from "@/entities/submission";
import { taskQueries } from "@/entities/task";
import { TextSubmissionReview, useReviewTextSubmissionMutation } from "@/features/submission/review-text";
import { ApiClientError } from "@/shared/api/client";
import { ErrorState, LoadingState } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";

export function TeacherSubmissionDetailView({
  studentId,
  submissionId,
}: Readonly<{ studentId: string; submissionId: string }>) {
  const submission = useQuery(teacherSubmissionQueries.detail(studentId, submissionId));
  const student = useQuery({ ...studentQueries.detail(studentId), enabled: submission.isSuccess });
  const task = useQuery({ ...taskQueries.detail(submission.data?.taskId ?? ""), enabled: submission.isSuccess });
  const queue = useQuery({
    ...dashboardQueries.attention({ type: "SUBMISSION_NEEDS_REVIEW", page: 0, size: 2 }),
    enabled: submission.isSuccess,
  });
  const review = useReviewTextSubmissionMutation(studentId);
  const next = queue.data?.items.find((item) => item.resourceId !== submissionId);
  const reviewed = submission.data && submission.data.status !== "NEEDS_REVIEW";

  if (submission.isPending)
    return (
      <main>
        <LoadingState>Загружаем решение…</LoadingState>
      </main>
    );
  if (submission.isError) {
    const notFound = submission.error instanceof ApiClientError && submission.error.status === 404;
    return (
      <main className="page-stack">
        <ErrorState
          title={notFound ? "Решение не найдено или недоступно" : "Не удалось загрузить решение"}
          onRetry={notFound ? undefined : () => void submission.refetch()}
        />
        <Link href="/teacher#teacher-attention">Рабочая очередь</Link>
      </main>
    );
  }
  return (
    <main className="page-stack">
      <Link className="text-sm text-primary underline" href="/teacher#teacher-attention">
        ← Рабочая очередь
      </Link>
      <PageHeader
        title="Проверка решения"
        description={student.data ? `${student.data.firstName} ${student.data.lastName ?? ""}` : undefined}
      />
      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="text-primary underline" href={`/teacher/students/${studentId}`}>
          Профиль ученика
        </Link>
        <Link className="text-primary underline" href={`/teacher/tasks/${submission.data.taskId}`}>
          {task.data?.title ?? "Связанное задание"}
        </Link>
      </div>
      <TextSubmissionReview studentId={studentId} submission={submission.data} review={review} />
      {reviewed && (
        <section className="space-y-3" aria-label="Следующая работа">
          {queue.isPending ? (
            <LoadingState>Ищем следующую работу…</LoadingState>
          ) : queue.isError ? (
            <ErrorState title="Не удалось обновить очередь" onRetry={() => void queue.refetch()} />
          ) : next ? (
            <Link className={buttonClassName()} href={getAttentionPresentation(next).href}>
              Следующая работа · {next.displayName}
            </Link>
          ) : (
            <p className="text-sm text-foreground-muted">Все ожидающие работы проверены.</p>
          )}
        </section>
      )}
      {!reviewed && (
        <Button type="button" variant="secondary" onClick={() => void submission.refetch()}>
          Обновить решение
        </Button>
      )}
    </main>
  );
}
