"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { homeworkQueries } from "@/entities/homework";
import { HomeworkForm } from "@/features/homework/create";
import { ApiClientError } from "@/shared/api/client";

export function TeacherStudentHomeworkEditPage({
  studentId,
  homeworkId,
}: Readonly<{
  studentId: string;
  homeworkId: string;
}>) {
  const homework = useQuery(homeworkQueries.detail(studentId, homeworkId));
  if (homework.isPending)
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p aria-busy="true">Загружаем домашнее задание…</p>
      </main>
    );
  if (homework.isError || homework.data.status !== "ASSIGNED") {
    const missing = homework.error instanceof ApiClientError && homework.error.status === 404;
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <p role="alert">{missing ? "Домашнее задание не найдено" : "Это домашнее задание нельзя редактировать."}</p>
        <Link className="underline" href={`/teacher/students/${studentId}/homework/${homeworkId}`}>
          Вернуться к заданию
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div>
        <Link
          className="text-sm text-neutral-600 underline"
          href={`/teacher/students/${studentId}/homework/${homeworkId}`}
        >
          ← Домашнее задание
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Редактировать домашнее задание</h1>
      </div>
      <HomeworkForm studentId={studentId} homework={homework.data} />
    </main>
  );
}
