"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenText } from "lucide-react";

import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

import { ProgramOverviewCard } from "./program-overview-card";

export function StudentProgramsView() {
  const programs = useQuery(studentProgramQueries.currentList());

  const active = programs.data?.filter((program) => program.status === "ACTIVE") ?? [];
  const other = programs.data?.filter((program) => program.status !== "ACTIVE") ?? [];

  return (
    <main className="page-stack">
      <PageHeader
        eyebrow="Учебный кабинет"
        title="Мои программы"
        description="Программы обучения, назначенные вашим преподавателем."
      />

      <div className="space-y-7 sm:space-y-8">
        {programs.isPending && (
          <p className="rounded-surface bg-surface-subtle p-5 text-sm text-(--text-secondary)" aria-busy="true">
            Загружаем программы…
          </p>
        )}

        {programs.isError && (
          <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
            <p className="text-sm text-danger">Не удалось загрузить ваши программы.</p>
            <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {!programs.isError && programs.data?.length === 0 && (
          <div className="rounded-surface bg-(--surface-muted) px-4 py-6 text-center">
            <BookOpenText size={30} className="mx-auto text-primary" aria-hidden="true" />
            <p className="mt-4 font-semibold text-foreground">Пока нет программ</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--text-secondary)">
              Когда преподаватель назначит программу обучения, она появится здесь.
            </p>
          </div>
        )}

        {!programs.isError && active.length > 0 && (
          <section aria-labelledby="current-programs-heading" className="min-w-0 space-y-4">
            <h2 id="current-programs-heading" className="section-title">
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
            <h2 id="other-programs-heading" className="section-title">
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
