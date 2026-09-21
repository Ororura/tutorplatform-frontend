"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { MaterialList, topicMaterialQueries } from "@/entities/material";
import { taskDifficultyPresentation, taskQueries, taskTypePresentation, topicTaskQueries } from "@/entities/task";
import { AttachTaskToTopicDialog } from "@/features/task/attach";
import { getLearningProgram, getLearningProgramBySlug, learningProgramQueries } from "@/entities/learning-program";
import { CreateMarkdownMaterialDialog } from "@/features/material/create";
import { EditMaterialDialog, isEditableMaterial } from "@/features/material/edit";
import { useReorderLessonMaterialsMutation } from "@/features/material/reorder";
import { UploadMaterialDialog } from "@/features/material/upload";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

type Props = { programId: string; topicId: string };

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export function TeacherProgramTopicMaterialsView({ programId: programRoute, topicId: topicRoute }: Readonly<Props>) {
  const router = useRouter();

  const program = useQuery({
    queryKey: UUID_PATTERN.test(programRoute)
      ? learningProgramQueries.detail(programRoute).queryKey
      : learningProgramQueries.bySlug(programRoute).queryKey,

    queryFn: () =>
      UUID_PATTERN.test(programRoute) ? getLearningProgram(programRoute) : getLearningProgramBySlug(programRoute),
  });
  const topicContext = program.data?.modules
    .flatMap((module) => module.topics.map((topic) => ({ module, topic })))
    .find(({ topic }) => topic.id === topicRoute || topic.slug === topicRoute);

  const topicId = topicContext?.topic.id ?? "";

  useEffect(() => {
    if (!program.data || !topicContext) return;

    const canonicalProgramSlug = program.data.slug;
    const canonicalTopicSlug = topicContext.topic.slug;

    if (programRoute === canonicalProgramSlug && topicRoute === canonicalTopicSlug) {
      return;
    }

    router.replace(`/teacher/programs/${canonicalProgramSlug}/topics/${canonicalTopicSlug}${window.location.search}`);
  }, [program.data, topicContext, programRoute, topicRoute, router]);
  const materials = useQuery({
    ...topicMaterialQueries.list(topicId),
    enabled: Boolean(topicContext),
  });
  const topicTasks = useQuery({
    ...topicTaskQueries.list(topicId),
    enabled: Boolean(topicContext),
  });
  const taskBank = useQuery({
    ...taskQueries.activeForSubject(program.data?.subject?.id ?? ""),
    enabled: Boolean(topicContext && program.data?.subject?.id),
  });
  const programNotFound = program.error instanceof ApiClientError && program.error.status === 404;
  const materialsNotFound = materials.error instanceof ApiClientError && materials.error.status === 404;
  const topicTasksNotFound = topicTasks.error instanceof ApiClientError && topicTasks.error.status === 404;
  const sortedMaterials = materials.data && [...materials.data].sort((left, right) => left.position - right.position);
  const reorderMaterials = useReorderLessonMaterialsMutation(topicId);
  const materialsEditable = Boolean(program.data && program.data.status !== "ARCHIVED");

  function moveMaterial(index: number, direction: -1 | 1) {
    if (!sortedMaterials || reorderMaterials.isPending) return;

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedMaterials.length) return;

    const orderedIds = sortedMaterials.map((material) => material.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];
    reorderMaterials.mutate({ orderedIds });
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link className="font-medium hover:text-blue-600" href="/teacher/programs">
          Программы обучения
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          className="font-medium hover:text-blue-600"
          href={`/teacher/programs/${program.data?.slug ?? programRoute}`}
        >
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
              {materialsEditable && (
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
                renderActions={(material, index) =>
                  materialsEditable ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        aria-label={`Переместить «${material.title}» вверх`}
                        disabled={index === 0 || reorderMaterials.isPending}
                        onClick={() => moveMaterial(index, -1)}
                        type="button"
                        variant="secondary"
                      >
                        Вверх
                      </Button>
                      <Button
                        aria-label={`Переместить «${material.title}» вниз`}
                        disabled={index === sortedMaterials.length - 1 || reorderMaterials.isPending}
                        onClick={() => moveMaterial(index, 1)}
                        type="button"
                        variant="secondary"
                      >
                        Вниз
                      </Button>
                      {isEditableMaterial(material) && <EditMaterialDialog material={material} />}
                    </div>
                  ) : null
                }
              />
            )}
          </section>

          <section className="space-y-4" aria-labelledby="practice-tasks-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950" id="practice-tasks-heading">
                  Практические задания
                </h2>
                <p className="mt-1 text-sm text-slate-500">Задания из банка по предмету программы.</p>
              </div>
              {program.data?.editable && topicTasks.data && taskBank.data && (
                <AttachTaskToTopicDialog topicId={topicId} attachedTasks={topicTasks.data} tasks={taskBank.data} />
              )}
            </div>
            {topicTasks.isPending && (
              <p className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500" aria-busy="true">
                Загружаем задания…
              </p>
            )}
            {topicTasks.isError && (
              <div className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
                <p>{topicTasksNotFound ? "Тема недоступна." : "Не удалось загрузить практические задания."}</p>
                {!topicTasksNotFound && (
                  <Button type="button" variant="secondary" onClick={() => void topicTasks.refetch()}>
                    Повторить
                  </Button>
                )}
              </div>
            )}
            {taskBank.isError && (
              <div className="space-y-3 rounded-[28px] border border-red-100 bg-red-50 p-6" role="alert">
                <p>Не удалось загрузить банк заданий.</p>
                <Button type="button" variant="secondary" onClick={() => void taskBank.refetch()}>
                  Повторить
                </Button>
              </div>
            )}
            {topicTasks.data && (
              <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_12px_40px_rgba(45,79,135,0.06)]">
                {topicTasks.data.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">К теме пока не прикреплены задания.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {topicTasks.data.map((task) => (
                      <li key={task.taskId} className="flex flex-wrap items-center justify-between gap-3 p-5">
                        <div>
                          <p className="font-semibold text-slate-900">{task.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {taskTypePresentation[task.taskType as keyof typeof taskTypePresentation] ?? task.taskType}{" "}
                            · {taskDifficultyPresentation[task.difficulty]}
                            {!task.required && " · Необязательное"}
                          </p>
                        </div>
                        <Link
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          href={`/teacher/tasks/${task.taskId}`}
                        >
                          Открыть задание
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
