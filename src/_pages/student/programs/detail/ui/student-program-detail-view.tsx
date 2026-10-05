"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenText, ChevronRight, Layers3, LockKeyhole } from "lucide-react";
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
        <div className="surface text-sm text-(--text-secondary)" aria-busy="true">
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
      <main className="page-content page-stack min-w-0">
        <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-6" role="alert">
          <h1 className="page-title">{title}</h1>

          <p className="text-sm leading-6 text-danger">
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
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) transition hover:text-primary"
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
    <main className="page-content page-stack min-w-0">
      <section className="py-2">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) transition hover:text-primary"
          href="/student/programs"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Мои программы
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
              <BookOpenText size={22} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">{data.subject.name}</p>

              <h1 className="page-title mt-1 wrap-break-word">{data.title}</h1>

              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-foreground-muted">
                {data.description || "Описание программы пока не добавлено."}
              </p>
            </div>
          </div>

          <span className="badge shrink-0 bg-primary-subtle text-primary">{programStatusLabels[data.status]}</span>
        </div>
      </section>

      <section className="surface">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-surface-subtle text-foreground-muted">
            <Layers3 size={19} aria-hidden="true" />
          </span>

          <div>
            <p className="text-sm font-medium text-primary">Учебный план</p>

            <h2 className="section-title mt-1" id="program-modules-heading">
              Модули и темы
            </h2>
          </div>
        </div>

        {data.modules.length === 0 ? (
          <p className="mt-5 rounded-surface border border-dashed border-border bg-surface-subtle/60 p-8 text-center text-sm text-(--text-secondary)">
            В программе пока нет модулей.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-border border-y border-border" aria-labelledby="program-modules-heading">
            {data.modules.map((module, moduleIndex) => (
              <li className="min-w-0 py-2" key={module.id}>
                <div className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-inset bg-surface text-sm font-semibold text-foreground-muted">
                      {moduleIndex + 1}
                    </span>

                    <div className="min-w-0">
                      <h3 className="wrap-break-word font-semibold text-foreground">{module.title}</h3>

                      {module.description && (
                        <p className="mt-1 wrap-break-word whitespace-pre-line text-sm leading-6 text-(--text-secondary)">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {module.topics.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-(--text-secondary) sm:px-6">В модуле пока нет тем.</p>
                ) : (
                  <ol className="divide-y divide-border">
                    {module.topics.map((topic, topicIndex) => {
                      const locked = topic.progressStatus === "LOCKED";

                      const content = (
                        <>
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-inset bg-surface-subtle text-xs font-semibold text-(--text-secondary)">
                              {topicIndex + 1}
                            </span>

                            <span className="min-w-0 wrap-break-word font-medium text-foreground">{topic.title}</span>
                          </span>

                          <span className="flex items-center gap-3 self-end sm:self-auto">
                            {topic.progressStatus && <TopicProgressBadge status={topic.progressStatus} />}

                            {locked ? (
                              <LockKeyhole className="shrink-0 text-foreground-subtle" size={17} aria-hidden="true" />
                            ) : (
                              <ChevronRight className="shrink-0 text-foreground-subtle" size={18} aria-hidden="true" />
                            )}
                          </span>
                        </>
                      );

                      return (
                        <li key={topic.id}>
                          {locked ? (
                            <div
                              aria-label={`Тема «${topic.title}» заблокирована`}
                              className="flex cursor-not-allowed flex-col gap-3 px-5 py-4 opacity-70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                              {content}
                            </div>
                          ) : (
                            <Link
                              className="flex flex-col gap-3 px-5 py-4 transition hover:bg-primary-subtle/40 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                              href={`/student/programs/${data.id}/topics/${topic.id}`}
                            >
                              {content}
                            </Link>
                          )}
                        </li>
                      );
                    })}
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
