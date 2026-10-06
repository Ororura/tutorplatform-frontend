"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, BookOpenText, CheckCircle2, ChevronRight, FilePenLine } from "lucide-react";
import Link from "next/link";

import { type LearningProgramStatus, learningProgramQueries } from "@/entities/learning-program";
import { ActivateLearningProgramButton } from "@/features/program/activate";
import { CreateLearningProgramDialog } from "@/features/program/create";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";

const statusPresentation: Record<LearningProgramStatus, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активна",
  ARCHIVED: "В архиве",
};

const statusClassName: Record<LearningProgramStatus, string> = {
  DRAFT: "bg-warning-subtle text-warning",
  ACTIVE: "bg-success-subtle text-success",
  ARCHIVED: "bg-surface-subtle text-foreground-muted",
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
    <main className="page-stack">
      <PageHeader
        title="Программы обучения"
        description="Создавайте шаблоны обучения и назначайте активные программы ученикам."
        actions={<CreateLearningProgramDialog />}
      />

      <section className="min-w-0" aria-labelledby="program-list-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="program-list-title" className="section-title">
              Ваши программы
            </h2>

            <p className="mt-1 text-sm text-foreground-muted">Черновик нужно активировать перед назначением ученику.</p>
          </div>

          {programs.isFetching && (
            <span className="text-sm text-primary" role="status">
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
              <dt className="text-foreground-muted">{label}</dt>
              <dd className="font-medium tabular-nums text-foreground">{count ?? "—"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          {programs.isPending && (
            <div className="rounded-surface bg-surface-subtle p-6 text-sm text-foreground-muted" aria-busy="true">
              Загружаем программы…
            </div>
          )}

          {programs.isError && (
            <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
              <p className="text-sm text-danger">Не удалось загрузить программы.</p>

              <Button type="button" variant="secondary" onClick={() => void programs.refetch()}>
                Повторить
              </Button>
            </div>
          )}

          {programs.data?.length === 0 && (
            <div className="rounded-surface bg-(--surface-muted) px-4 py-6 text-center">
              <BookOpenText size={28} className="mx-auto text-primary" />

              <h2 className="section-title mt-4">Программ пока нет</h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">
                Создайте первую программу. После активации её можно будет назначить ученику.
              </p>
            </div>
          )}

          {programs.data && programs.data.length > 0 && (
            <div className="divide-y divide-(--border) border-y border-border divide-border">
              {programs.data.map((program) => {
                const StatusIcon = statusIcon[program.status];

                return (
                  <article
                    key={program.id}
                    className="group relative grid gap-3 px-3 py-4 transition hover:bg-surface/80 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                  >
                    <Link
                      className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                      href={`/teacher/programs/${program.slug}`}
                      aria-label={`Открыть программу: ${program.title}`}
                    />

                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-surface-subtle text-foreground-muted">
                        <BookOpenText size={19} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="wrap-break-word font-semibold text-foreground">{program.title}</h3>
                        <p className="mt-1 text-sm text-foreground-muted">
                          <span className="font-medium">{program.subject.name}</span>
                          {program.description && (
                            <span className="line-clamp-2 wrap-break-word">{program.description}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-13 sm:justify-end sm:pl-0">
                      <span className={`badge  ${statusClassName[program.status]}`}>
                        <StatusIcon size={13} aria-hidden="true" />
                        {statusPresentation[program.status]}
                      </span>
                      {program.status === "DRAFT" && (
                        <div className="relative z-10 max-w-60">
                          <ActivateLearningProgramButton programId={program.id} triggerVariant="secondary" />
                        </div>
                      )}
                      <ChevronRight size={17} aria-hidden="true" className="text-foreground-subtle" />
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
