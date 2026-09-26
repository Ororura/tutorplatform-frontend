"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, ChevronRight, Layers3 } from "lucide-react";
import Link from "next/link";

import { programStatusLabels, studentProgramQueries, TopicProgressBadge } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiClientError) {
    return error.status;
  }

  return (error as { status?: number } | null)?.status;
}

export function StudentProgramDetailView({ studentProgramId }: Readonly<{ studentProgramId: string }>) {
  const program = useQuery(studentProgramQueries.currentDetail(studentProgramId));

  if (program.isPending) {
    return (
      <main>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-slate-500" aria-busy="true">
          Загружаем программу…
        </div>
      </main>
    );
  }

  if (program.isError) {
    const status = getErrorStatus(program.error);
    const title =
      status === 403
        ? "Нет доступа к программе"
        : status === 404
          ? "Программа не найдена"
          : "Не удалось загрузить программу";

    return (
      <main className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-6" role="alert">
          <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          <p className="text-sm leading-6 text-red-700">
            {status === 403
              ? "Эта программа недоступна для вашей учётной записи."
              : status === 404
                ? "Возможно, программа больше не назначена или ссылка устарела."
                : "Попробуйте повторить запрос."}
          </p>
          {status !== 403 && status !== 404 && (
            <Button type="button" variant="secondary" onClick={() => program.refetch()}>
              Повторить
            </Button>
          )}
        </div>

        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href="/student/programs"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Вернуться к программам
        </Link>
      </main>
    );
  }

  const data = program.data;

  return (
    <main className="space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href="/student/programs"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Мои программы
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpenText size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600">{data.subject.name}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{data.title}</h1>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600">
                {data.description || "Описание программы пока не добавлено."}
              </p>
            </div>
          </div>

          <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            {programStatusLabels[data.status]}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Layers3 size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-600">Учебный план</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950" id="program-modules-heading">
              Модули и темы
            </h2>
          </div>
        </div>

        {data.modules.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
            В программе пока нет модулей.
          </p>
        ) : (
          <ol className="mt-5 space-y-4" aria-labelledby="program-modules-heading">
            {data.modules.map((module, moduleIndex) => (
              <li className="overflow-hidden rounded-[14px] border border-slate-200/80" key={module.id}>
                <div className="bg-slate-50/70 px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-blue-600 shadow-sm">
                      {moduleIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950">{module.title}</h3>
                      {module.description && (
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-500">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {module.topics.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">В модуле пока нет тем.</p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {module.topics.map((topic, topicIndex) => (
                      <li key={topic.id}>
                        <Link
                          className="flex flex-col gap-3 px-5 py-4 transition hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                          href={`/student/programs/${data.id}/topics/${topic.id}`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                              {topicIndex + 1}
                            </span>
                            <span className="font-medium text-slate-900">{topic.title}</span>
                          </span>
                          <span className="flex items-center gap-3 self-end sm:self-auto">
                            {topic.progressStatus && <TopicProgressBadge status={topic.progressStatus} />}
                            <ChevronRight className="shrink-0 text-slate-400" size={18} aria-hidden="true" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
