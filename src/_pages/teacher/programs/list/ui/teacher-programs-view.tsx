"use client";

import { useQuery } from "@tanstack/react-query";
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
  DRAFT: "bg-amber-50 text-amber-800",
  ACTIVE: "bg-emerald-50 text-emerald-800",
  ARCHIVED: "bg-neutral-100 text-neutral-600",
};

export function TeacherProgramsView() {
  const programs = useQuery(learningProgramQueries.list());

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-neutral-600 underline underline-offset-4" href="/teacher/students">
              ← Ученики
            </Link>

            <Link className="text-neutral-600 underline underline-offset-4" href="/teacher/tasks">
              Банк заданий
            </Link>
          </div>

          <h1 className="mt-4 text-3xl font-semibold">Программы обучения</h1>

          <p className="mt-2 max-w-2xl text-neutral-600">
            Здесь хранятся шаблоны программ преподавателя. Активные программы можно назначать ученикам.
          </p>
        </div>

        <CreateLearningProgramDialog />
      </div>

      {programs.isPending && (
        <p className="rounded-lg border border-neutral-200 p-5 text-neutral-600" aria-busy="true">
          Загружаем программы…
        </p>
      )}

      {programs.isError && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>Не удалось загрузить программы.</p>

          <Button type="button" onClick={() => void programs.refetch()}>
            Повторить
          </Button>
        </div>
      )}

      {programs.data?.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center">
          <h2 className="text-lg font-semibold">Программ пока нет</h2>

          <p className="mt-2 text-sm text-neutral-600">
            Создайте первую программу. После активации её можно будет назначить ученику.
          </p>
        </div>
      )}

      {programs.data && programs.data.length > 0 && (
        <section className="space-y-4" aria-labelledby="program-list-title">
          <div className="flex items-center justify-between gap-4">
            <h2 id="program-list-title" className="text-xl font-semibold">
              Ваши программы
            </h2>

            {programs.isFetching && (
              <span className="text-sm text-neutral-500" role="status">
                Обновляем…
              </span>
            )}
          </div>

          <div className="grid gap-4">
            {programs.data.map((program) => (
              <article key={program.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{program.title}</h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[program.status]}`}
                      >
                        {statusPresentation[program.status]}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-neutral-500">{program.subject.name}</p>

                    {program.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{program.description}</p>
                    )}

                    {program.status === "DRAFT" && (
                      <p className="mt-3 text-sm text-neutral-500">
                        Черновик нельзя назначить ученику. Сначала активируйте программу.
                      </p>
                    )}
                  </div>

                  {program.status === "DRAFT" && (
                    <div className="shrink-0">
                      <ActivateLearningProgramButton programId={program.id} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
