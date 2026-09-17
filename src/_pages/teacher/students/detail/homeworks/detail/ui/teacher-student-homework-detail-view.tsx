"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  formatHomeworkDate,
  getHomeworkPresentationState,
  homeworkQueries,
  homeworkStatusPresentation,
} from "@/entities/homework";
import { submissionStatusPresentation, teacherSubmissionQueries, type TeacherSubmission } from "@/entities/submission";
import { studentProgramQueries } from "@/entities/student-program";
import { useCancelHomeworkMutation } from "@/features/homework/cancel";
import { useReviewTextSubmissionMutation } from "@/features/submission/review-text";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentHomeworkDetailView({
  studentId,
  homeworkId,
}: Readonly<{
  studentId: string;
  homeworkId: string;
}>) {
  const homework = useQuery(homeworkQueries.detail(studentId, homeworkId));

  const programs = useQuery(studentProgramQueries.list(studentId));

  const submissions = useQuery(teacherSubmissionQueries.list(studentId));

  const cancel = useCancelHomeworkMutation(studentId, homeworkId);

  const review = useReviewTextSubmissionMutation(studentId, homeworkId);

  const [cancelError, setCancelError] = useState("");

  if (homework.isPending) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p aria-busy="true">Загружаем домашнее задание…</p>
      </main>
    );
  }

  if (homework.isError) {
    const notFound = homework.error instanceof ApiClientError && homework.error.status === 404;

    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>{notFound ? "Домашнее задание не найдено" : "Не удалось загрузить домашнее задание."}</p>

          {!notFound && (
            <Button type="button" onClick={() => homework.refetch()}>
              Повторить
            </Button>
          )}
        </div>

        <Link className="underline" href={`/teacher/students/${studentId}/homework`}>
          Вернуться к домашним заданиям
        </Link>
      </main>
    );
  }

  const state = getHomeworkPresentationState(homework.data);

  const program = programs.data?.find((item) => item.id === homework.data.studentProgramId);

  const items = [...homework.data.items].sort((a, b) => a.position - b.position);

  const latestSubmissions = getLatestSubmissionsByHomeworkItem(submissions.data?.items ?? []);

  const onCancel = async () => {
    if (!window.confirm("Отменить это домашнее задание?")) {
      return;
    }

    setCancelError("");

    try {
      await cancel.mutateAsync();
    } catch {
      setCancelError("Не удалось отменить домашнее задание.");
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div>
        <Link className="text-sm text-neutral-600 underline" href={`/teacher/students/${studentId}/homework`}>
          ← Домашние задания
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{homework.data.title}</h1>

            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-1 text-sm ${
                state === "OVERDUE" ? "bg-red-50 text-red-800" : "bg-neutral-100"
              }`}
            >
              {homeworkStatusPresentation[state]}
            </span>
          </div>

          {homework.data.status === "ASSIGNED" && (
            <div className="flex gap-3">
              <Link
                className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium"
                href={`/teacher/students/${studentId}/homework/${homeworkId}/edit`}
              >
                Редактировать
              </Link>

              <Button
                className="bg-red-700 hover:bg-red-600"
                disabled={cancel.isPending}
                type="button"
                onClick={onCancel}
              >
                {cancel.isPending ? "Отменяем…" : "Отменить домашнее задание"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {cancelError && (
        <p className="text-red-700" role="alert">
          {cancelError}
        </p>
      )}

      <section className="rounded-lg border bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-neutral-500">Программа</dt>

            <dd>{program ? `${program.title} · ${program.subject.name}` : "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-neutral-500">Назначено</dt>

            <dd>{formatHomeworkDate(homework.data.assignedAt)}</dd>
          </div>

          <div>
            <dt className="text-sm text-neutral-500">Срок</dt>

            <dd>{homework.data.dueAt ? formatHomeworkDate(homework.data.dueAt) : "Без срока"}</dd>
          </div>

          <div>
            <dt className="text-sm text-neutral-500">Выполнено</dt>

            <dd>{homework.data.completedAt ? formatHomeworkDate(homework.data.completedAt) : "—"}</dd>
          </div>
        </dl>

        {homework.data.description && (
          <div className="mt-5 border-t pt-5">
            <h2 className="mb-2 font-medium">Описание</h2>

            <p className="whitespace-pre-wrap">{homework.data.description}</p>
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="items-heading">
        <h2 className="text-xl font-semibold" id="items-heading">
          Задания
        </h2>

        {submissions.isError && (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
            <p>Не удалось загрузить решения ученика.</p>

            <Button type="button" onClick={() => submissions.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        <ol className="divide-y rounded-lg border bg-white">
          {items.map((item) => {
            const submission = latestSubmissions.get(item.id);

            return (
              <li className="space-y-4 p-4" key={item.id}>
                <div className="flex items-center gap-4">
                  <span className="text-neutral-500">{item.position + 1}.</span>

                  {item.taskId ? (
                    <Link
                      className="flex-1 font-medium underline underline-offset-4"
                      href={`/teacher/tasks/${item.taskId}`}
                    >
                      {item.taskTitle ?? "Открыть задание"}
                    </Link>
                  ) : (
                    <span className="flex-1">{item.taskTitle ?? "Задание"}</span>
                  )}

                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs">
                    {item.required ? "Обязательное" : "Необязательное"}
                  </span>
                </div>

                {submission?.textAnswer !== undefined && (
                  <TextSubmissionReview submission={submission} review={review} studentId={studentId} />
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

function TextSubmissionReview({
  studentId,
  submission,
  review,
}: Readonly<{
  studentId: string;
  submission: TeacherSubmission;
  review: ReturnType<typeof useReviewTextSubmissionMutation>;
}>) {
  const isCurrentSubmission = review.variables?.submissionId === submission.id;

  const reviewing = review.isPending && isCurrentSubmission;

  return (
    <section
      className="ml-8 space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4"
      aria-label="Ответ ученика"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Ответ ученика</h3>

        <div className="flex items-center gap-2">
          <SubmissionStatus status={submission.status} />

          <span className="text-xs text-neutral-500">Попытка {submission.attemptNo}</span>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm">{submission.textAnswer}</p>

      {submission.status === "NEEDS_REVIEW" && (
        <div className="space-y-3 border-t pt-3">
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
              className="bg-red-700 hover:bg-red-600"
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

          {review.isError && isCurrentSubmission && (
            <p className="text-sm text-red-700" role="alert">
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
      return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">Ожидает проверки</span>;

    case "PASSED":
      return <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800">Принято</span>;

    case "FAILED":
      return <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-800">Не принято</span>;

    default:
      return <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs">{label}</span>;
  }
}

function getLatestSubmissionsByHomeworkItem(submissions: TeacherSubmission[]) {
  const latest = new Map<string, TeacherSubmission>();

  for (const submission of submissions) {
    if (!submission.homeworkItemId) {
      continue;
    }

    const current = latest.get(submission.homeworkItemId);

    if (!current || submission.attemptNo > current.attemptNo) {
      latest.set(submission.homeworkItemId, submission);
    }
  }

  return latest;
}
