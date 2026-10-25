"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { teacherSubmissionQueries } from "@/entities/submission";
import { useReviewTextSubmissionMutation } from "@/features/submission/review-text";
import { SubmissionReview } from "@/features/submission/review-text/ui/submission-review";
import { Button } from "@/shared/ui/button";

export function TeacherSubmissionInbox({ studentId }: Readonly<{ studentId: string }>) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const submissions = useQuery({ ...teacherSubmissionQueries.awaiting(studentId, page), enabled: open });
  const review = useReviewTextSubmissionMutation(studentId);
  return (
    <section className="surface space-y-4" aria-label="Решения на проверку">
      <h2 className="section-title">Решения на проверку</h2>
      <Button type="button" variant="secondary" onClick={() => setOpen((value) => !value)}>
        {open ? "Скрыть решения" : "Открыть решения"}
      </Button>
      {open && (
        <>
          {submissions.isPending && <p aria-busy="true">Загружаем решения…</p>}
          {submissions.isError && <p role="alert">Не удалось загрузить решения.</p>}
          {submissions.data?.items.length === 0 && <p>На этой странице нет решений, ожидающих проверки.</p>}
          {submissions.data?.items.map((item) => (
            <div key={item.id} className="space-y-2">
              <Link className="text-sm underline" href={`/teacher/tasks/${item.taskId}`}>
                Открыть условие задания
              </Link>
              <SubmissionReview submission={item} studentId={studentId} review={review} />
            </div>
          ))}
          <div className="flex gap-3">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
              Назад
            </Button>
            <Button
              variant="secondary"
              disabled={!submissions.data || page + 1 >= submissions.data.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Далее
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
