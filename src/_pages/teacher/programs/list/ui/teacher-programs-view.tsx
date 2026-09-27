"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, BookOpenText, CheckCircle2, ChevronRight, FilePenLine } from "lucide-react";
import Link from "next/link";

import { type LearningProgramStatus, learningProgramQueries } from "@/entities/learning-program";
import { ActivateLearningProgramButton } from "@/features/program/activate";
import { CreateLearningProgramDialog } from "@/features/program/create";
import { Button } from "@/shared/ui/button";

const statusPresentation: Record<LearningProgramStatus, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активна",
  ARCHIVED: "В архиве",
};

const statusClassName: Record<LearningProgramStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

const statusIcon = {
  DRAFT: FilePenLine,
  ACTIVE: CheckCircle2,
  ARCHIVED: Archive,
} satisfies Record<LearningProgramStatus, typeof FilePenLine>;

export function TeacherProgramsView() {
  const programs = useQuery(learningProgramQueries.list());

  const draftCount = programs.data?.filter((program) => program.status === "DRAFT").length ?? 0;

  const activeCount = programs.data?.filter((program) => program.status === "ACTIVE").length ?? 0;

  const archivedCount = programs.data?.filter((program) => program.status === "ARCHIVED").length ?? 0;

  return (
    <main className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Программы обучения</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Создавайте шаблоны обучения и назначайте активные программы ученикам.
          </p>
        </div>

        <CreateLearningProgramDialog />
      </header>

      <section className="min-w-0" aria-labelledby="program-list-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="program-list-title" className="text-base font-semibold text-slate-950">
              Ваши программы
            </h2>

            <p className="mt-1 text-sm text-slate-500">Черновик нужно активировать перед назначением ученику.</p>
          </div>

          {programs.isFetching && (
            <span className="text-sm text-blue-600" role="status">
              Обновляем…
            </span>
          )}
        </div>

        <dl aria-label="Состояние программ" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {[
            ["Все", programs.data?.length],
            ["Активные", programs.data ? activeCount : undefined],
            ["Черновики", programs.data ? draftCount : undefined],
            ["Архив", programs.data ? archivedCount : undefined],
          ].map(([label, count]) => (
            <div key={label} className="flex items-center gap-2">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium tabular-nums text-slate-900">{count ?? "—"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          {programs.isPending && (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500" aria-busy="true">
              Загружаем программы…
            </div>
          )}

          {programs.isError && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
              <p className="text-sm text-red-700">Не удалось загрузить программы.</p>

              <Button type="button" variant="secondary" onClick={() => void programs.refetch()}>
                Повторить
              </Button>
            </div>
          )}

          {programs.data?.length === 0 && (
            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-6 text-center">
              <BookOpenText size={28} className="mx-auto text-blue-500" />

              <h2 className="mt-4 font-semibold text-slate-950">Программ пока нет</h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Создайте первую программу. После активации её можно будет назначить ученику.
              </p>
            </div>
          )}

          {programs.data && programs.data.length > 0 && (
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {programs.data.map((program) => {
                const StatusIcon = statusIcon[program.status];

                return (
                  <article
                    key={program.id}
                    className="group relative grid gap-3 px-3 py-4 transition hover:bg-white/80 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                  >
                    <Link
                      className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                      href={`/teacher/programs/${program.slug}`}
                      aria-label={`Открыть программу: ${program.title}`}
                    />

                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <BookOpenText size={19} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-950">{program.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          <span className="font-medium">{program.subject.name}</span>
                          {program.description && (
                            <span className="line-clamp-2 break-words">{program.description}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-13 sm:justify-end sm:pl-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[program.status]}`}
                      >
                        <StatusIcon size={13} aria-hidden="true" />
                        {statusPresentation[program.status]}
                      </span>
                      {program.status === "DRAFT" && (
                        <div className="relative z-10 max-w-60">
                          <ActivateLearningProgramButton programId={program.id} />
                        </div>
                      )}
                      <ChevronRight size={17} aria-hidden="true" className="text-slate-400" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
