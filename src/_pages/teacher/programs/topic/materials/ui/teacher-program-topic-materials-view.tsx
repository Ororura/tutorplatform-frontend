"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { MaterialList, topicMaterialQueries } from "@/entities/material";
import { learningProgramQueries } from "@/entities/learning-program";
import { CreateMarkdownMaterialDialog } from "@/features/material/create";
import { EditMaterialDialog, isEditableMaterial } from "@/features/material/edit";
import { UploadMaterialDialog } from "@/features/material/upload";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

type Props = { programId: string; topicId: string };

export function TeacherProgramTopicMaterialsView({ programId, topicId }: Readonly<Props>) {
  const program = useQuery(learningProgramQueries.detail(programId));
  const topicContext = program.data?.modules
    .flatMap((module) => module.topics.map((topic) => ({ module, topic })))
    .find(({ topic }) => topic.id === topicId);
  const materials = useQuery({
    ...topicMaterialQueries.list(topicId),
    enabled: Boolean(topicContext),
  });
  const programNotFound = program.error instanceof ApiClientError && program.error.status === 404;
  const materialsNotFound = materials.error instanceof ApiClientError && materials.error.status === 404;
  const sortedMaterials = materials.data && [...materials.data].sort((left, right) => left.position - right.position);

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link className="font-medium hover:text-blue-600" href="/teacher/programs">
          Программы обучения
        </Link>
        <span aria-hidden="true">/</span>
        <Link className="font-medium hover:text-blue-600" href={`/teacher/programs/${programId}`}>
          {program.data?.title ?? "Программа"}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Материалы темы</span>
      </nav>

      {program.isPending && (
        <div
          className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          aria-busy="true"
        >
          Загружаем тему…
        </div>
      )}
      {program.isError && (
        <section className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
          <h1 className="text-xl font-semibold text-slate-950">
            {programNotFound ? "Программа не найдена" : "Не удалось загрузить тему."}
          </h1>
          {!programNotFound && (
            <Button type="button" variant="secondary" onClick={() => void program.refetch()}>
              Повторить
            </Button>
          )}
        </section>
      )}
      {program.data && !topicContext && (
        <section
          className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          role="alert"
        >
          <h1 className="text-xl font-semibold text-slate-950">Тема не найдена</h1>
          <p className="mt-2 text-sm text-slate-600">Эта тема не входит в выбранную программу.</p>
        </section>
      )}
      {topicContext && (
        <>
          <header className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]">
            <p className="text-sm text-slate-500">{topicContext.module.title}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{topicContext.topic.title}</h1>
            {topicContext.topic.description && (
              <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">{topicContext.topic.description}</p>
            )}
          </header>

          <section className="space-y-4" aria-labelledby="materials-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950" id="materials-heading">
                Материалы
              </h2>
              {program.data?.editable && (
                <div className="flex flex-wrap gap-2">
                  <CreateMarkdownMaterialDialog topicId={topicId} position={sortedMaterials?.length ?? 0} editable />
                  <UploadMaterialDialog topicId={topicId} position={sortedMaterials?.length ?? 0} editable />
                </div>
              )}
            </div>
            {materials.isPending && (
              <p className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500" aria-busy="true">
                Загружаем материалы…
              </p>
            )}
            {materials.isError && (
              <div className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
                <p>{materialsNotFound ? "Тема не найдена" : "Не удалось загрузить материалы."}</p>
                {!materialsNotFound && (
                  <Button type="button" variant="secondary" onClick={() => void materials.refetch()}>
                    Повторить
                  </Button>
                )}
              </div>
            )}
            {sortedMaterials && (
              <MaterialList
                materials={sortedMaterials}
                renderActions={(material) =>
                  program.data?.editable && isEditableMaterial(material) ? (
                    <EditMaterialDialog material={material} />
                  ) : null
                }
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
