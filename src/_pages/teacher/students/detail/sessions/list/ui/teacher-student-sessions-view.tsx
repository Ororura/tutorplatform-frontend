"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SessionList, sessionQueries } from "@/entities/session";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

const primaryLinkClassName =
  "inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600";

function parsePage(value: string | null): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function TeacherStudentSessionsView({
  studentId,
}: Readonly<{
  studentId: string;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));

  const params = {
    page,
    sort: "startedAt,desc",
  } as const;

  const sessions = useQuery(sessionQueries.list(studentId, params));

  const programs = useQuery(studentProgramQueries.list(studentId));

  const navigatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams.toString());

    if (nextPage === 0) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }

    const suffix = next.toString();

    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-[1280px] space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href={`/teacher/students/${studentId}`}
        >
          <ArrowLeft size={16} />
          Профиль ученика
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CalendarDays size={21} />
            </span>

            <div>
              <p className="text-sm font-medium text-blue-600">Учебный процесс</p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Занятия</h1>

              <p className="mt-2 text-sm text-slate-500">История проведённых занятий ученика.</p>
            </div>
          </div>

          {programs.data && programs.data.length > 0 && (
            <Link className={primaryLinkClassName} href={`/teacher/students/${studentId}/sessions/new`}>
              <Plus size={16} className="mr-2" />
              Добавить занятие
            </Link>
          )}
        </div>
      </section>

      <StudentProfileNav active="sessions" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">История занятий</h2>

              <p className="mt-1 text-sm text-slate-500">Последние занятия отображаются первыми.</p>
            </div>

            {sessions.isFetching && !sessions.isPending && (
              <span className="text-sm text-blue-600" role="status">
                Обновляем…
              </span>
            )}
          </div>

          <div className="mt-5">
            {sessions.isPending && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                Загружаем занятия…
              </p>
            )}

            {sessions.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить занятия.</p>

                <Button type="button" variant="secondary" onClick={() => sessions.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {sessions.data?.items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                <CalendarDays size={28} className="mx-auto text-blue-500" />

                <p className="mt-4 font-semibold text-slate-950">Занятий пока нет</p>

                {programs.data && programs.data.length > 0 ? (
                  <Link className={`${primaryLinkClassName} mt-5`} href={`/teacher/students/${studentId}/sessions/new`}>
                    Добавить занятие
                  </Link>
                ) : programs.data?.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm text-slate-500">Сначала назначьте ученику программу обучения</p>

                    <Link
                      className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                      href={`/teacher/students/${studentId}/program`}
                    >
                      Перейти в раздел «Программа»
                    </Link>
                  </>
                ) : null}
              </div>
            )}

            {sessions.data && sessions.data.items.length > 0 && (
              <SessionList sessions={sessions.data.items} studentId={studentId} />
            )}
          </div>

          {sessions.data && sessions.data.totalPages > 1 && (
            <nav
              className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5"
              aria-label="Пагинация занятий"
            >
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                disabled={page === 0 || sessions.isFetching}
                onClick={() => navigatePage(page - 1)}
              >
                Назад
              </button>

              <span className="text-sm text-slate-500">
                Страница {sessions.data.page + 1} из {sessions.data.totalPages}
              </span>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                disabled={page + 1 >= sessions.data.totalPages || sessions.isFetching}
                onClick={() => navigatePage(page + 1)}
              >
                Вперёд
              </button>
            </nav>
          )}
        </section>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <CalendarDays size={20} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Занятия ученика</h2>

            <div className="mt-5 flex items-end justify-between rounded-2xl bg-white/80 p-4">
              <span className="text-sm text-slate-500">Всего</span>

              <span className="text-2xl font-semibold text-slate-950">{sessions.data?.totalElements ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
