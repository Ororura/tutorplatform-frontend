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
      <main className="page-form page-stack">
        <p aria-busy="true">Загружаем домашнее задание…</p>
      </main>
    );
  if (homework.isError || homework.data.status !== "ASSIGNED") {
    const missing = homework.error instanceof ApiClientError && homework.error.status === 404;
    return (
      <main className="page-form page-stack">
        <p role="alert">{missing ? "Домашнее задание не найдено" : "Это домашнее задание нельзя редактировать."}</p>
        <Link className="underline" href={`/teacher/students/${studentId}/homework/${homeworkId}`}>
          Вернуться к заданию
        </Link>
      </main>
    );
  }
  return (
    <main className="page-form page-stack">
      <div>
        <Link
          className="text-sm text-foreground-muted underline"
          href={`/teacher/students/${studentId}/homework/${homeworkId}`}
        >
          ← Домашнее задание
        </Link>
        <h1 className="page-title mt-4">Редактировать домашнее задание</h1>
      </div>
      <HomeworkForm studentId={studentId} homework={homework.data} />
    </main>
  );
}
