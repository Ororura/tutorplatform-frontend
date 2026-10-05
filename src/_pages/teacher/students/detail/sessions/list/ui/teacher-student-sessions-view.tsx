"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SessionList, sessionQueries } from "@/entities/session";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button, buttonClassName } from "@/shared/ui/button";

const primaryLinkClassName = buttonClassName();

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
    <main className="page-stack">
      <section className="surface sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-primary"
          href={`/teacher/students/${studentId}`}
        >
          <ArrowLeft size={16} />
          Профиль ученика
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-surface bg-primary-subtle text-primary">
              <CalendarDays size={21} />
            </span>

            <div>
              <p className="text-sm font-medium text-primary">Учебный процесс</p>

              <h1 className="page-title mt-1">Занятия</h1>

              <p className="mt-2 text-sm text-foreground-muted">История проведённых занятий ученика.</p>
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
        <section className="surface min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">История занятий</h2>

              <p className="mt-1 text-sm text-foreground-muted">Последние занятия отображаются первыми.</p>
            </div>

            {sessions.isFetching && !sessions.isPending && (
              <span className="text-sm text-primary" role="status">
                Обновляем…
              </span>
            )}
          </div>

          <div className="mt-5">
            {sessions.isPending && (
              <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
                Загружаем занятия…
              </p>
            )}

            {sessions.isError && (
              <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
                <p className="text-sm text-danger">Не удалось загрузить занятия.</p>

                <Button type="button" variant="secondary" onClick={() => sessions.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {sessions.data?.items.length === 0 && (
              <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
                <CalendarDays size={28} className="mx-auto text-primary" />

                <p className="mt-4 font-semibold text-foreground">Занятий пока нет</p>

                {programs.data && programs.data.length > 0 ? (
                  <Link className={`${primaryLinkClassName} mt-5`} href={`/teacher/students/${studentId}/sessions/new`}>
                    Добавить занятие
                  </Link>
                ) : programs.data?.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm text-foreground-muted">Сначала назначьте ученику программу обучения</p>

                    <Link
                      className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary"
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
              className="mt-5 flex items-center justify-between border-t border-border pt-5"
              aria-label="Пагинация занятий"
            >
              <button
                className="rounded-surface border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition hover:bg-surface-subtle disabled:opacity-40"
                type="button"
                disabled={page === 0 || sessions.isFetching}
                onClick={() => navigatePage(page - 1)}
              >
                Назад
              </button>

              <span className="text-sm text-foreground-muted">
                Страница {sessions.data.page + 1} из {sessions.data.totalPages}
              </span>

              <button
                className="rounded-surface border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition hover:bg-surface-subtle disabled:opacity-40"
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
          <section className="rounded-surface border border-primary-border bg-surface-subtle p-6">
            <CalendarDays size={20} className="text-primary" />

            <h2 className="section-title mt-4">Занятия ученика</h2>

            <div className="mt-5 flex items-end justify-between rounded-surface bg-surface/80 p-4">
              <span className="text-sm text-foreground-muted">Всего</span>

              <span className="text-2xl font-semibold text-foreground">{sessions.data?.totalElements ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
