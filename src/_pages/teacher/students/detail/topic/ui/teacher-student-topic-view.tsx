"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <Link
        className="text-sm text-neutral-600 underline underline-offset-4"
        href={`/teacher/students/${studentId}/programs/${studentProgramId}`}
      >
        ← К программе
      </Link>

      {program.isPending && <p aria-busy="true">Загружаем тему…</p>}
      {program.isError && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <h1 className="text-2xl font-semibold">
            {programNotFound ? "Тема не найдена" : "Не удалось загрузить тему."}
          </h1>
          {!programNotFound && (
            <Button type="button" onClick={() => program.refetch()}>
              Повторить
            </Button>
          )}
        </div>
      )}
      {program.data && !topicContext && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6" role="alert">
          <h1 className="text-2xl font-semibold">Тема не найдена</h1>
        </div>
      )}
      {topicContext && (
        <>
          <header className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600">
              {program.data?.title} · {topicContext.module.title}
            </p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold">{topicContext.topic.title}</h1>
              <TopicProgressBadge status={topicContext.topic.progressStatus} />
            </div>
            {topicContext.topic.description && (
              <p className="mt-4 whitespace-pre-line leading-7 text-neutral-700">{topicContext.topic.description}</p>
            )}
          </header>

          <section className="space-y-4" aria-labelledby="materials-heading">
            <h2 className="text-xl font-semibold" id="materials-heading">
              Материалы
            </h2>
            {materials.isPending && (
              <p className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-600" aria-busy="true">
                Загружаем материалы…
              </p>
            )}
            {materials.isError && (
              <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
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
