"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AttendanceBadge, formatSessionDateTime, formatSessionDuration, sessionQueries } from "@/entities/session";
import { studentProgramQueries } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherStudentSessionDetailView({
  studentId,
  sessionId,
}: Readonly<{
  studentId: string;
  sessionId: string;
}>) {
  const session = useQuery(sessionQueries.detail(studentId, sessionId));
  const program = useQuery({
    ...studentProgramQueries.detail(studentId, session.data?.studentProgramId ?? ""),
    enabled: Boolean(session.data?.studentProgramId),
  });

  if (session.isPending)
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p aria-busy="true">Загружаем занятие…</p>
      </main>
    );
  if (session.isError) {
    const notFound = session.error instanceof ApiClientError && session.error.status === 404;
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>{notFound ? "Занятие не найдено" : "Не удалось загрузить занятие."}</p>
          {!notFound && (
            <Button type="button" onClick={() => session.refetch()}>
              Повторить
            </Button>
          )}
        </div>
        <Link className="underline underline-offset-4" href={`/teacher/students/${studentId}/sessions`}>
          Вернуться к занятиям
        </Link>
      </main>
    );
  }

  const topicMap = new Map(
    program.data?.modules.flatMap((module) => module.topics.map((topic) => [topic.id, topic.title] as const)) ?? [],
  );
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div>
        <Link
          className="text-sm text-neutral-600 underline underline-offset-4"
          href={`/teacher/students/${studentId}/sessions`}
        >
          ← Все занятия
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-600">
              {program.data?.subject.name}
              {program.data ? " · " : ""}
              {program.data?.title}
            </p>
            <h1 className="mt-1 text-3xl font-semibold">{formatSessionDateTime(session.data.startedAt)}</h1>
          </div>
          <Link
            className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600"
            href={`/teacher/students/${studentId}/sessions/${sessionId}/edit`}
          >
            Редактировать
          </Link>
        </div>
      </div>
      <section className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-neutral-500">Посещаемость</dt>
            <dd className="mt-2">
              <AttendanceBadge status={session.data.attendanceStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-500">Длительность</dt>
            <dd className="mt-1 font-medium">{formatSessionDuration(session.data.durationMinutes)}</dd>
          </div>
        </dl>
        <div>
          <h2 className="font-semibold">Пройденные темы</h2>
          {program.isPending && (
            <p className="mt-2 text-sm text-neutral-500" aria-busy="true">
              Загружаем названия тем…
            </p>
          )}
          {session.data.topics.length === 0 ? (
            <p className="mt-2 text-neutral-600">Темы не указаны.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {session.data.topics.map((topic) => (
                <li className="flex items-center gap-2" key={topic.topicId}>
                  <span aria-hidden="true">{topic.isPrimary ? "★" : "•"}</span>
                  <span>{topicMap.get(topic.topicId) ?? "Тема программы"}</span>
                  {topic.isPrimary && <span className="text-xs text-neutral-500">Основная тема</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold">Краткое описание занятия</h2>
          <p className="mt-2 whitespace-pre-line text-neutral-700">{session.data.summary || "Не указано"}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 p-4">
          <h2 className="font-semibold">Личные заметки</h2>
          <p className="mt-1 text-xs text-neutral-500">Видны только преподавателю</p>
          <p className="mt-2 whitespace-pre-line text-neutral-700">{session.data.privateNotes || "Не указаны"}</p>
        </div>
      </section>
    </main>
  );
}
