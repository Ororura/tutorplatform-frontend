"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, BookOpenText, CheckCircle2, FilePenLine } from "lucide-react";
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
    <main className="space-y-4">
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-sm font-medium text-blue-600">Учебный процесс</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Программы обучения</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Создавайте шаблоны обучения и назначайте активные программы ученикам.
          </p>
        </div>

        <CreateLearningProgramDialog />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="program-list-title" className="text-xl font-semibold text-slate-950">
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                <BookOpenText size={28} className="mx-auto text-blue-500" />

                <h2 className="mt-4 font-semibold text-slate-950">Программ пока нет</h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Создайте первую программу. После активации её можно будет назначить ученику.
                </p>
              </div>
            )}

            {programs.data && programs.data.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {programs.data.map((program) => {
                  const StatusIcon = statusIcon[program.status];

                  return (
                    <article
                      key={program.id}
                      className="group relative flex min-h-56 flex-col rounded-[14px] border border-slate-200/80 bg-[var(--surface-muted)] p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <Link
                        className="absolute inset-0 rounded-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        href={`/teacher/programs/${program.slug}`}
                        aria-label={`Открыть программу: ${program.title}`}
                      />

                      <div className="flex items-start justify-between gap-4">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <BookOpenText size={20} />
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusClassName[program.status]
                          }`}
                        >
                          <StatusIcon size={13} />

                          {statusPresentation[program.status]}
                        </span>
                      </div>

                      <div className="mt-5 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                          {program.subject.name}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-slate-950">{program.title}</h3>

                        {program.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{program.description}</p>
                        )}

                        {program.status === "DRAFT" && (
                          <p className="mt-3 text-sm text-slate-500">
                            Черновик нельзя назначить ученику. Сначала активируйте программу.
                          </p>
                        )}
                      </div>

                      {program.status === "DRAFT" && (
                        <div className="relative z-10 mt-5 border-t border-slate-100 pt-4">
                          <ActivateLearningProgramButton programId={program.id} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BookOpenText size={19} />
              </span>

              <div>
                <h2 className="font-semibold text-slate-950">Состояние программ</h2>

                <p className="text-xs text-slate-500">Все шаблоны</p>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">Активные</dt>

                <dd className="font-semibold text-emerald-700">{activeCount}</dd>
              </div>

              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">Черновики</dt>

                <dd className="font-semibold text-amber-700">{draftCount}</dd>
              </div>

              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">Архив</dt>

                <dd className="font-semibold text-slate-700">{archivedCount}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <FilePenLine size={21} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Рабочий процесс</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Создайте черновик, наполните программу и активируйте её перед назначением ученику.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
