"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, Layers3 } from "lucide-react";
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
    <main className="space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-600">Учебный кабинет</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Мои программы</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Программы обучения, назначенные вашим преподавателем.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
          {programs.isPending && (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
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
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
              <BookOpenText size={30} className="mx-auto text-blue-500" aria-hidden="true" />
              <p className="mt-4 font-semibold text-slate-950">Программ пока нет</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Когда преподаватель назначит программу обучения, она появится здесь.
              </p>
            </div>
          )}

          {programs.data && programs.data.length > 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Назначенные программы</h2>
                <p className="mt-1 text-sm text-slate-500">Откройте программу, чтобы посмотреть её содержание.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {programs.data.map((program) => (
                  <article
                    key={program.id}
                    className="flex min-h-64 flex-col rounded-[22px] border border-slate-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_35px_rgba(45,79,135,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <BookOpenText size={20} aria-hidden="true" />
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[program.status]}`}
                      >
                        {programStatusLabels[program.status]}
                      </span>
                    </div>

                    <div className="mt-5 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        {program.subject.name}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{program.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {program.description || "Описание программы пока не добавлено."}
                      </p>
                    </div>

                    <Link
                      className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600"
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

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-[28px] border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-blue-600">
              <Layers3 size={19} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-950">Учебный план</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Все назначенные вам программы в одном месте.</p>
            <div className="mt-5 flex items-end justify-between rounded-2xl bg-white/80 p-4">
              <span className="text-sm text-slate-500">Всего программ</span>
              <span className="text-2xl font-semibold text-slate-950">{programs.data?.length ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
