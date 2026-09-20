"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, BookOpenText, CheckCircle2, ChevronRight, FilePenLine, Layers3 } from "lucide-react";
import Link from "next/link";

import { type LearningProgramStatus, learningProgramQueries } from "@/entities/learning-program";
import { ActivateLearningProgramButton } from "@/features/program/activate";
import { ArchiveLearningProgramButton } from "@/features/program/archive";
import { EditLearningProgramDialog } from "@/features/program/edit";
import { ApiClientError } from "@/shared/api/client";
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

export function TeacherProgramDetailView({ programId }: Readonly<{ programId: string }>) {
  const program = useQuery(learningProgramQueries.detail(programId));
  const notFound = program.error instanceof ApiClientError && program.error.status === 404;

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
        href="/teacher/programs"
      >
        ← Программы обучения
      </Link>

      {program.isPending && (
        <div
          className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          aria-busy="true"
        >
          Загружаем программу…
        </div>
      )}

      {program.isError && (
        <section className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
          <h1 className="text-xl font-semibold text-slate-950">
            {notFound ? "Программа не найдена" : "Не удалось загрузить программу."}
          </h1>
          <p className="text-sm text-slate-600">
            {notFound
              ? "Возможно, программа была удалена или у вас нет к ней доступа."
              : "Попробуйте обновить страницу ещё раз."}
          </p>
          {!notFound && (
            <Button type="button" variant="secondary" onClick={() => void program.refetch()}>
              Повторить
            </Button>
          )}
        </section>
      )}

      {program.data &&
        (() => {
          const StatusIcon = statusIcon[program.data.status];
          const modules = [...program.data.modules].sort((a, b) => a.position - b.position);

          return (
            <>
              <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BookOpenText size={23} />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName[program.data.status]}`}
                  >
                    <StatusIcon size={13} />
                    {statusPresentation[program.data.status]}
                  </span>
                </div>
                <p className="mt-6 text-sm font-medium text-blue-600">{program.data.subject.name}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{program.data.title}</h1>
                <section className="mt-6" aria-labelledby="program-description-heading">
                  <h2 id="program-description-heading" className="text-sm font-semibold text-slate-950">
                    Описание
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                    {program.data.description || "Описание программы пока не добавлено."}
                  </p>
                </section>
                {program.data.status !== "ARCHIVED" && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                    {program.data.editable && <EditLearningProgramDialog program={program.data} />}
                    {program.data.status === "DRAFT" && <ActivateLearningProgramButton programId={program.data.id} />}
                    <ArchiveLearningProgramButton programId={program.data.id} />
                  </div>
                )}
              </section>

              <section
                className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7"
                aria-labelledby="program-modules-heading"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Layers3 size={19} />
                  </span>
                  <div>
                    <h2 id="program-modules-heading" className="text-xl font-semibold text-slate-950">
                      Модули программы
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {modules.length} {modules.length === 1 ? "модуль" : "модулей"}
                    </p>
                  </div>
                </div>

                {modules.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                    <h3 className="font-semibold text-slate-950">Модулей пока нет</h3>
                    <p className="mt-2 text-sm text-slate-500">Структура программы ещё не заполнена.</p>
                  </div>
                ) : (
                  <ol className="mt-6 space-y-4">
                    {modules.map((module) => {
                      const topics = [...module.topics].sort((a, b) => a.position - b.position);
                      return (
                        <li key={module.id} className="rounded-2xl border border-slate-200/80 p-5">
                          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            Модуль {module.position + 1}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950">{module.title}</h3>
                          {module.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-500">{module.description}</p>
                          )}
                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-semibold text-slate-950">Темы</h4>
                            {topics.length === 0 ? (
                              <p className="mt-2 text-sm text-slate-500">В этом модуле пока нет тем.</p>
                            ) : (
                              <ol className="mt-3 space-y-2">
                                {topics.map((topic) => (
                                  <li key={topic.id} className="flex items-start gap-2 text-sm text-slate-700">
                                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-blue-500" />
                                    <div>
                                      <span className="font-medium">{topic.title}</span>
                                      {topic.description && (
                                        <p className="mt-0.5 text-slate-500">{topic.description}</p>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </>
          );
        })()}
    </main>
  );
}
