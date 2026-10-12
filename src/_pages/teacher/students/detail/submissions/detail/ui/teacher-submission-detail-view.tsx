"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
  const review = useReviewTextSubmissionMutation(studentId);
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
    </main>
  );
}
