"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SessionList, sessionQueries } from "@/entities/session";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function TeacherStudentSessionsView({ studentId }: Readonly<{ studentId: string }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const params = { page, sort: "startedAt,desc" } as const;
  const sessions = useQuery(sessionQueries.list(studentId, params));
  const programs = useQuery(studentProgramQueries.list(studentId));

  const navigatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage === 0) next.delete("page"); else next.set("page", String(nextPage));
    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <Link className="text-sm text-neutral-600 underline underline-offset-4" href={`/teacher/students/${studentId}`}>← Профиль ученика</Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Занятия</h1>
          {programs.data && programs.data.length > 0 && <Link className="inline-flex h-10 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white" href={`/teacher/students/${studentId}/sessions/new`}>Добавить занятие</Link>}
        </div>
      </div>
      <StudentProfileNav active="sessions" studentId={studentId} />

      {sessions.isFetching && !sessions.isPending && <p className="text-sm text-neutral-500" role="status">Обновляем историю…</p>}
      {sessions.isPending && <p className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-600" aria-busy="true">Загружаем занятия…</p>}
      {sessions.isError && <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert"><p>Не удалось загрузить занятия.</p><Button type="button" onClick={() => sessions.refetch()}>Повторить</Button></div>}
      {sessions.data?.items.length === 0 && (
        <div className="space-y-4 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="font-medium">Занятий пока нет</p>
          {programs.data && programs.data.length > 0 ? <Link className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white" href={`/teacher/students/${studentId}/sessions/new`}>Добавить занятие</Link> : programs.data?.length === 0 ? <><p className="text-sm text-neutral-600">Сначала назначьте ученику программу обучения</p><Link className="underline underline-offset-4" href={`/teacher/students/${studentId}/program`}>Перейти в раздел «Программа»</Link></> : null}
        </div>
      )}
      {sessions.data && sessions.data.items.length > 0 && <SessionList sessions={sessions.data.items} studentId={studentId} />}
      {sessions.data && sessions.data.totalPages > 1 && <nav className="flex items-center justify-between" aria-label="Пагинация занятий"><button className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-50" type="button" disabled={page === 0 || sessions.isFetching} onClick={() => navigatePage(page - 1)}>Назад</button><span className="text-sm text-neutral-600">Страница {sessions.data.page + 1} из {sessions.data.totalPages}</span><button className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-50" type="button" disabled={page + 1 >= sessions.data.totalPages || sessions.isFetching} onClick={() => navigatePage(page + 1)}>Вперёд</button></nav>}
    </main>
  );
}
