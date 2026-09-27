"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText } from "lucide-react";
import Link from "next/link";

import { programStatusLabels, studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

const statusClassNames = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
} as const;

export function StudentProgramsView() {
  const programs = useQuery(studentProgramQueries.currentList());

  return (
    <main className="space-y-6">
      <section className="py-2">
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[var(--text-secondary)]">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Учебный кабинет</p>
            <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Мои программы
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Программы обучения, назначенные вашим преподавателем.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <section className="min-w-0">
          {programs.isPending && (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-[var(--text-secondary)]" aria-busy="true">
              Загружаем программы…
            </p>
          )}

          {programs.isError && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
              <p className="text-sm text-red-700">Не удалось загрузить ваши программы.</p>
              <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
                Повторить
              </Button>
            </div>
          )}

          {programs.data?.length === 0 && (
            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-6 text-center">
              <BookOpenText size={30} className="mx-auto text-blue-500" aria-hidden="true" />
              <p className="mt-4 font-semibold text-slate-950">Программ пока нет</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Когда преподаватель назначит программу обучения, она появится здесь.
              </p>
            </div>
          )}

          {programs.data && programs.data.length > 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Назначенные программы</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Откройте программу, чтобы посмотреть её содержание.
                </p>
              </div>

              <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {programs.data.map((program) => (
                  <article
                    key={program.id}
                    className="grid min-w-0 gap-3 px-3 py-4 transition hover:bg-white/80 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div className="flex items-center gap-3 sm:col-start-2 sm:row-start-1">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[program.status]}`}
                      >
                        {programStatusLabels[program.status]}
                      </span>
                    </div>

                    <div className="min-w-0 sm:col-start-1 sm:row-start-1">
                      <p className="text-sm font-medium text-[var(--text-secondary)]">{program.subject.name}</p>
                      <h3 className="mt-1 break-words font-semibold text-slate-950">{program.title}</h3>
                      <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-[var(--text-secondary)]">
                        {program.description || "Описание программы пока не добавлено."}
                      </p>
                    </div>

                    <Link
                      className="inline-flex min-h-10 items-center gap-2 justify-self-start rounded-md text-sm font-medium text-blue-600 hover:text-blue-700 sm:col-start-3 sm:row-start-1 sm:justify-self-end"
                      href={`/student/programs/${program.id}`}
                    >
                      Открыть программу
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--text-secondary)]">
          <p>Все назначенные вам программы в одном месте.</p>
          <p>
            Всего программ:{" "}
            <span className="font-medium tabular-nums text-slate-900">{programs.data?.length ?? "—"}</span>
          </p>
        </aside>
      </div>
    </main>
  );
}
