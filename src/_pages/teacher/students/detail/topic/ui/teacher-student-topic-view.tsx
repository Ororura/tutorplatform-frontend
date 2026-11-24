"use client";

import { PageBackLink, PageHeader } from "@/shared/ui/page-header";
import { useQuery } from "@tanstack/react-query";

import { MaterialList, topicMaterialQueries } from "@/entities/material";
import { studentProgramQueries, TopicProgressBadge } from "@/entities/student-program";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

type Props = { studentId: string; studentProgramId: string; topicId: string };

export function TeacherStudentTopicView({ studentId, studentProgramId, topicId }: Readonly<Props>) {
  const program = useQuery(studentProgramQueries.detail(studentId, studentProgramId));
  const topicContext = program.data?.modules
    .flatMap((module) => module.topics.map((topic) => ({ module, topic })))
    .find(({ topic }) => topic.id === topicId);
  const materials = useQuery({
    ...topicMaterialQueries.list(topicId),
    enabled: Boolean(topicContext),
  });

  const programNotFound = program.isError && program.error instanceof ApiClientError && program.error.status === 404;

  return (
    <main className="page-stack">
      <PageBackLink href={`/teacher/students/${studentId}/programs/${studentProgramId}`}>К программе</PageBackLink>

      {program.isPending && <p aria-busy="true">Загружаем тему…</p>}
      {program.isError && (
        <div className="space-y-3 rounded-inset border border-danger-border bg-danger-subtle p-5" role="alert">
          <h1 className="page-title">{programNotFound ? "Тема не найдена" : "Не удалось загрузить тему."}</h1>
          {!programNotFound && (
            <Button type="button" onClick={() => program.refetch()}>
              Повторить
            </Button>
          )}
        </div>
      )}
      {program.data && !topicContext && (
        <div className="rounded-inset border border-border bg-surface p-6" role="alert">
          <h1 className="page-title">Тема не найдена</h1>
        </div>
      )}
      {topicContext && (
        <>
          <PageHeader
            eyebrow={`${program.data?.title} · ${topicContext.module.title}`}
            title={topicContext.topic.title}
            details={
              topicContext.topic.description && (
                <p className="page-description whitespace-pre-line">{topicContext.topic.description}</p>
              )
            }
            actions={<TopicProgressBadge status={topicContext.topic.progressStatus} />}
          />
          <section className="space-y-4" aria-labelledby="materials-heading">
            <h2 className="section-title" id="materials-heading">
              Материалы
            </h2>
            {materials.isPending && (
              <p className="rounded-inset border border-border bg-surface p-5 text-foreground-muted" aria-busy="true">
                Загружаем материалы…
              </p>
            )}
            {materials.isError && (
              <div className="space-y-3 rounded-inset border border-danger-border bg-danger-subtle p-5" role="alert">
                <p>
                  {materials.error instanceof ApiClientError && materials.error.status === 404
                    ? "Тема не найдена"
                    : "Не удалось загрузить материалы."}
                </p>
                {!(materials.error instanceof ApiClientError && materials.error.status === 404) && (
                  <Button type="button" onClick={() => materials.refetch()}>
                    Повторить
                  </Button>
                )}
              </div>
            )}
            {materials.data && <MaterialList materials={materials.data} />}
          </section>
        </>
      )}
    </main>
  );
}
