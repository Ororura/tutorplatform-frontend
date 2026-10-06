"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { sessionQueries } from "@/entities/session";
import { SessionForm } from "@/features/session/manage";
import { ApiClientError } from "@/shared/api/client";

export function TeacherStudentSessionEditView({
  studentId,
  sessionId,
}: Readonly<{
  studentId: string;
  sessionId: string;
}>) {
  const session = useQuery(sessionQueries.detail(studentId, sessionId));
  if (session.isPending)
    return (
      <main className="page-form page-stack">
        <p aria-busy="true">Загружаем занятие…</p>
      </main>
    );
  if (session.isError)
    return (
      <main className="page-form page-stack">
        <p role="alert">
          {session.error instanceof ApiClientError && session.error.status === 404
            ? "Занятие не найдено"
            : "Не удалось загрузить занятие."}
        </p>
        <Link className="underline" href={`/teacher/students/${studentId}/sessions`}>
          Вернуться к занятиям
        </Link>
      </main>
    );
  return (
    <main className="page-form page-stack">
      <div>
        <Link
          className="text-sm text-foreground-muted underline underline-offset-4"
          href={`/teacher/students/${studentId}/sessions/${sessionId}`}
        >
          ← К занятию
        </Link>
        <h1 className="page-title mt-4">Редактировать занятие</h1>
      </div>
      <SessionForm studentId={studentId} session={session.data} />
    </main>
  );
}
