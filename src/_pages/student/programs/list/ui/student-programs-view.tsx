"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenText } from "lucide-react";

import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

import { ProgramOverviewCard } from "./program-overview-card";

export function StudentProgramsView() {
  const programs = useQuery(studentProgramQueries.currentList());

  const active = programs.data?.filter((program) => program.status === "ACTIVE") ?? [];
  const other = programs.data?.filter((program) => program.status !== "ACTIVE") ?? [];

  return (
    <main className="mx-auto max-w-360 space-y-7 sm:space-y-8">
      <header className="px-1 py-5 sm:px-5">
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-(--text-secondary)">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-(--text-secondary)">Учебный кабинет</p>
            <h1 className="mt-1 wrap-break-word text-3xl font-bold tracking-tight text-slate-950 xl:text-4xl">
              Мои программы
            </h1>
            <p className="mt-3 text-sm leading-6 text-(--text-secondary)">
              Программы обучения, назначенные вашим преподавателем.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-7 sm:space-y-8">
        {programs.isPending && (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-(--text-secondary)" aria-busy="true">
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

        {!programs.isError && programs.data?.length === 0 && (
          <div className="rounded-xl bg-(--surface-muted) px-4 py-6 text-center">
            <BookOpenText size={30} className="mx-auto text-blue-500" aria-hidden="true" />
            <p className="mt-4 font-semibold text-slate-950">Пока нет программ</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--text-secondary)">
              Когда преподаватель назначит программу обучения, она появится здесь.
            </p>
          </div>
        )}

        {!programs.isError && active.length > 0 && (
          <section aria-labelledby="current-programs-heading" className="min-w-0 space-y-4">
            <h2
              id="current-programs-heading"
              className="text-xl font-semibold tracking-tight text-slate-950 2xl:text-2xl"
            >
              {active.length === 1 ? "Текущая программа" : "Текущие программы"}
            </h2>
            <div className="space-y-4">
              {active.map((program) => (
                <ProgramOverviewCard key={program.id} program={program} active />
              ))}
            </div>
          </section>
        )}
        {!programs.isError && other.length > 0 && (
          <section aria-labelledby="other-programs-heading" className="min-w-0 space-y-4">
            <h2 id="other-programs-heading" className="text-lg font-semibold tracking-tight text-slate-950">
              Другие программы
            </h2>
            <div className="grid items-start gap-4 md:grid-cols-2">
              {other.map((program) => (
                <ProgramOverviewCard key={program.id} program={program} active={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
