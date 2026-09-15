"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { sessionQueries } from "@/entities/session";
import { SessionForm } from "@/features/session/manage";
import { ApiClientError } from "@/shared/api/client";

export function TeacherStudentSessionEditView({ studentId, sessionId }: Readonly<{ studentId: string; sessionId: string }>) {
  const session = useQuery(sessionQueries.detail(studentId, sessionId));
  if (session.isPending) return <main className="mx-auto max-w-3xl px-6 py-12"><p aria-busy="true">Загружаем занятие…</p></main>;
  if (session.isError) return <main className="mx-auto max-w-3xl space-y-4 px-6 py-12"><p role="alert">{session.error instanceof ApiClientError && session.error.status === 404 ? "Занятие не найдено" : "Не удалось загрузить занятие."}</p><Link className="underline" href={`/teacher/students/${studentId}/sessions`}>Вернуться к занятиям</Link></main>;
  return <main className="mx-auto max-w-3xl space-y-8 px-6 py-12"><div><Link className="text-sm text-neutral-600 underline underline-offset-4" href={`/teacher/students/${studentId}/sessions/${sessionId}`}>← К занятию</Link><h1 className="mt-4 text-3xl font-semibold">Редактировать занятие</h1></div><SessionForm studentId={studentId} session={session.data} /></main>;
}
