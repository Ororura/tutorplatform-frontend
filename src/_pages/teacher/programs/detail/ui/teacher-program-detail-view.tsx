"use client";
import { Input } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { Archive, CheckCircle2, ChevronRight, FilePenLine, Layers3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  type LearningProgramDetails,
  type LearningProgramStatus,
  getLearningProgram,
  getLearningProgramBySlug,
  learningProgramQueries,
} from "@/entities/learning-program";
import { ActivateLearningProgramButton } from "@/features/program/activate";
import { ArchiveLearningProgramButton } from "@/features/program/archive";
import { DuplicateLearningProgramButton } from "@/features/program/duplicate";
import { EditLearningProgramDialog } from "@/features/program/edit";
import { ImportContentPackageDialog } from "@/features/program/import";
import {
  CreateLearningProgramModuleDialog,
  LearningProgramModuleActions,
  useReorderLearningProgramModulesMutation,
} from "@/features/program/module/manage";
import {
  CreateLearningProgramTopicDialog,
  LearningProgramTopicActions,
  useReorderLearningProgramTopicsMutation,
} from "@/features/program/topic/manage";
import {
  BulkTopicStatusToolbar,
  useBulkTopicStatusMutation,
  type BulkTopicStatusRequest,
} from "@/features/program/topic/bulk-status";
import { ApiClientError } from "@/shared/api/client";
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

const topicStatusPresentation = {
  DRAFT: "Черновик",
  ACTIVE: "Активна",
  ARCHIVED: "В архиве",
} as const;

const topicStatusClassName = {
  DRAFT: "bg-warning-subtle text-warning",
  ACTIVE: "bg-success-subtle text-success",
  ARCHIVED: "bg-surface-subtle text-foreground-muted",
} as const;

function reorderedIds(ids: string[], index: number, direction: -1 | 1) {
  const nextIds = [...ids];
  [nextIds[index], nextIds[index + direction]] = [nextIds[index + direction], nextIds[index]];
  return nextIds;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function TeacherProgramDetailView({ programId }: Readonly<{ programId: string }>) {
  const router = useRouter();
  const program = useQuery({
    queryKey: UUID_PATTERN.test(programId)
      ? learningProgramQueries.detail(programId).queryKey
      : learningProgramQueries.bySlug(programId).queryKey,
    queryFn: () => (UUID_PATTERN.test(programId) ? getLearningProgram(programId) : getLearningProgramBySlug(programId)),
  });

  const reorderModules = useReorderLearningProgramModulesMutation(program.data?.id ?? "");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const bulkStatus = useBulkTopicStatusMutation(program.data?.id ?? "");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectionProgram, setSelectionProgram] = useState(program.data);
  const [bulkError, setBulkError] = useState("");
  const submitting = useRef(false);
  const allTopics = program.data?.modules.flatMap((module) => module.topics) ?? [];
  const selecting = selectionMode && Boolean(program.data?.editable);

  // Reconcile IDs with query data; versions always come from the latest query.
  if (selectionProgram !== program.data) {
    setSelectionProgram(program.data);
    if (selectionProgram?.id !== program.data?.id || !program.data?.editable) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      const availableIds = new Set(allTopics.map((topic) => topic.id));
      setSelectedIds(new Set([...selectedIds].filter((id) => availableIds.has(id))));
    }
  }

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkError("");
  };
  const toggleTopic = (id: string) => {
    if (submitting.current) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const submitBulkStatus = async (status: BulkTopicStatusRequest["status"]) => {
    if (submitting.current || !program.data?.editable) return;
    const topics = allTopics.filter((topic) => selectedIds.has(topic.id)).map(({ id, version }) => ({ id, version }));
    if (!topics.length) return;
    submitting.current = true;
    setBulkError("");
    try {
      await bulkStatus.mutateAsync({ status, topics });
      cancelSelection();
    } catch (error) {
      setBulkError(
        error instanceof ApiClientError && error.status === 409
          ? "Темы были изменены или больше недоступны. Данные программы обновлены. Повторите попытку."
          : "Не удалось изменить статус выбранных тем.",
      );
    } finally {
      submitting.current = false;
    }
  };
  const notFound = program.error instanceof ApiClientError && program.error.status === 404;

  useEffect(() => {
    const slug = program.data?.slug;

    if (!slug || !UUID_PATTERN.test(programId)) {
      return;
    }

    const canonicalPath = `/teacher/programs/${slug}`;

    router.replace(`${canonicalPath}${window.location.search}${window.location.hash}`);
  }, [programId, program.data?.slug, router]);

  return (
    <main className="page-content page-stack min-w-0">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-primary"
        href="/teacher/programs"
      >
        ← Программы обучения
      </Link>

      {program.isPending && (
        <div className="surface text-sm text-foreground-muted" aria-busy="true">
          Загружаем программу…
        </div>
      )}

      {program.isError && (
        <section className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-6" role="alert">
          <h1 className="page-title">{notFound ? "Программа не найдена" : "Не удалось загрузить программу."}</h1>
          <p className="text-sm text-foreground-muted">
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
              <section className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="min-w-0 wrap-break-word text-sm font-medium text-primary">
                    {program.data.subject.name}
                  </p>
                  <span className={`badge shrink-0  ${statusClassName[program.data.status]}`}>
                    <StatusIcon size={13} />
                    {statusPresentation[program.data.status]}
                  </span>
                </div>
                <h1 className="page-title mt-2 wrap-break-word">{program.data.title}</h1>
                <section className="mt-2" aria-labelledby="program-description-heading">
                  <h2 id="program-description-heading" className="sr-only">
                    Описание
                  </h2>
                  <p className="wrap-break-word whitespace-pre-wrap text-sm leading-6 text-foreground-muted">
                    {program.data.description || "Описание программы пока не добавлено."}
                  </p>
                </section>
                <div className="mt-3 flex flex-wrap gap-2">
                  {program.data.status !== "ARCHIVED" && (
                    <>
                      {program.data.editable && <EditLearningProgramDialog program={program.data} />}
                      {program.data.status === "DRAFT" && <ActivateLearningProgramButton programId={program.data.id} />}
                      <ArchiveLearningProgramButton programId={program.data.id} />
                    </>
                  )}
                  <DuplicateLearningProgramButton key={program.data.id} programId={program.data.id} />
                </div>
              </section>

              <section className="surface" aria-labelledby="program-modules-heading">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-surface bg-primary-subtle text-primary">
                      <Layers3 size={19} />
                    </span>
                    <div>
                      <h2 id="program-modules-heading" className="section-title">
                        Модули программы
                      </h2>
                      <p className="mt-1 text-sm text-foreground-muted">
                        {modules.length} {modules.length === 1 ? "модуль" : "модулей"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {program.data.editable && !selecting && (
                      <Button type="button" variant="secondary" onClick={() => setSelectionMode(true)}>
                        Выбрать темы
                      </Button>
                    )}
                    <ImportContentPackageDialog
                      programId={program.data.id}
                      editable={
                        program.data.editable &&
                        !selecting &&
                        program.data.status !== "ARCHIVED" &&
                        !program.data.hasAssignments
                      }
                    />
                    <CreateLearningProgramModuleDialog
                      programId={program.data.id}
                      editable={program.data.editable && !selecting}
                      onCreated={setExpandedModuleId}
                    />
                  </div>
                </div>

                {selecting && (
                  <BulkTopicStatusToolbar
                    count={selectedIds.size}
                    allSelected={allTopics.length > 0 && selectedIds.size === allTopics.length}
                    empty={allTopics.length === 0}
                    pending={bulkStatus.isPending}
                    error={bulkError}
                    onToggleAll={() =>
                      setSelectedIds(
                        selectedIds.size === allTopics.length ? new Set() : new Set(allTopics.map((topic) => topic.id)),
                      )
                    }
                    onCancel={cancelSelection}
                    onSubmit={submitBulkStatus}
                  />
                )}

                {modules.length === 0 ? (
                  <div className="mt-6 rounded-surface border border-dashed border-border bg-surface-subtle/60 p-8 text-center">
                    <h3 className="font-semibold text-foreground">Модулей пока нет</h3>
                    <p className="mt-2 text-sm text-foreground-muted">Структура программы ещё не заполнена.</p>
                  </div>
                ) : (
                  <ol className="mt-4 divide-y divide-border border-y border-border">
                    {modules.map((module, moduleIndex) => {
                      const topics = [...module.topics].sort((a, b) => a.position - b.position);
                      return (
                        <li key={module.id} className="relative">
                          <details
                            className="group"
                            open={expandedModuleId === module.id}
                            onToggle={(event) => setExpandedModuleId(event.currentTarget.open ? module.id : null)}
                          >
                            <summary
                              className={`cursor-pointer list-none rounded-control py-4 focus-visible:outline-2 focus-visible:outline-focus-ring ${program.data.editable && !selecting ? "pr-12" : ""}`}
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                <ChevronRight
                                  size={16}
                                  aria-hidden="true"
                                  className="mt-1 shrink-0 text-foreground-subtle transition-transform group-open:rotate-90"
                                />
                                <span aria-hidden="true" className="mt-0.5 text-sm tabular-nums text-foreground-subtle">
                                  {String(module.position + 1).padStart(2, "0")}.
                                </span>
                                <div className="min-w-0 flex-1">
                                  <h3 className="wrap-break-word font-semibold text-foreground">{module.title}</h3>
                                  {module.description && (
                                    <p className="mt-1 wrap-break-word text-sm leading-5 text-foreground-muted">
                                      {module.description}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-foreground-muted sm:hidden">{topics.length} тем</p>
                                </div>
                                <span className="mt-0.5 hidden shrink-0 text-xs text-foreground-muted sm:block">
                                  {topics.length} тем
                                </span>
                              </div>
                            </summary>
                            <div className="ml-2 border-l border-border pb-3 pl-3 sm:ml-5 sm:pl-5">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <h4 className="text-sm font-semibold text-foreground">Темы</h4>
                                <CreateLearningProgramTopicDialog
                                  programId={program.data.id}
                                  moduleId={module.id}
                                  editable={program.data.editable && !selecting}
                                />
                              </div>
                              {topics.length === 0 ? (
                                <p className="mt-2 text-sm text-foreground-muted">В этом модуле пока нет тем.</p>
                              ) : (
                                <TopicList
                                  programId={program.data.id}
                                  programSlug={program.data.slug}
                                  moduleId={module.id}
                                  topics={topics}
                                  selecting={selecting}
                                  selectedIds={selectedIds}
                                  selectionPending={bulkStatus.isPending}
                                  onToggleTopic={toggleTopic}
                                  editable={program.data.editable && !selecting}
                                />
                              )}
                            </div>
                          </details>
                          {program.data.editable && !selecting && (
                            <div className="absolute right-0 top-2">
                              <LearningProgramModuleActions
                                programId={program.data.id}
                                module={module}
                                editable={program.data.editable}
                                reorderActions={[
                                  {
                                    label: "Переместить вверх",
                                    disabled: reorderModules.isPending || moduleIndex === 0,
                                    onSelect: () =>
                                      reorderModules.mutate({
                                        orderedIds: reorderedIds(
                                          modules.map((item) => item.id),
                                          moduleIndex,
                                          -1,
                                        ),
                                      }),
                                  },
                                  {
                                    label: "Переместить вниз",
                                    disabled: reorderModules.isPending || moduleIndex === modules.length - 1,
                                    onSelect: () =>
                                      reorderModules.mutate({
                                        orderedIds: reorderedIds(
                                          modules.map((item) => item.id),
                                          moduleIndex,
                                          1,
                                        ),
                                      }),
                                  },
                                ]}
                              />
                            </div>
                          )}
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

function TopicList({
  programId,
  programSlug,
  moduleId,
  topics,
  editable,
  selecting,
  selectedIds,
  selectionPending,
  onToggleTopic,
}: Readonly<{
  programId: string;
  programSlug: string;
  moduleId: string;
  topics: LearningProgramDetails["modules"][number]["topics"];
  editable: boolean;
  selecting: boolean;
  selectedIds: Set<string>;
  selectionPending: boolean;
  onToggleTopic: (id: string) => void;
}>) {
  const reorderTopics = useReorderLearningProgramTopicsMutation(programId, moduleId);
  const topicIds = topics.map((topic) => topic.id);

  return (
    <ol className="mt-2 divide-y divide-border">
      {topics.map((topic, topicIndex) => (
        <li key={topic.id} className="flex items-start gap-2 py-3 text-sm text-foreground-muted">
          {selecting ? (
            <Input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-primary"
              aria-label={`Выбрать тему «${topic.title}»`}
              checked={selectedIds.has(topic.id)}
              disabled={selectionPending}
              onChange={() => onToggleTopic(topic.id)}
            />
          ) : (
            <ChevronRight size={16} className="mt-0.5 shrink-0 text-primary" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className="min-w-0 wrap-break-word font-medium text-foreground hover:text-primary hover:underline hover:underline-offset-4"
                href={`/teacher/programs/${programSlug}/topics/${topic.slug}`}
              >
                {topic.title}
              </Link>
              <span className={`badge shrink-0  ${topicStatusClassName[topic.status]}`}>
                {topicStatusPresentation[topic.status]}
              </span>
            </div>
            {topic.description && (
              <p className="mt-1 wrap-break-word leading-5 text-foreground-muted">{topic.description}</p>
            )}
          </div>
          <LearningProgramTopicActions
            programId={programId}
            moduleId={moduleId}
            topic={topic}
            editable={editable && !selecting}
            reorderActions={[
              {
                label: "Переместить вверх",
                disabled: reorderTopics.isPending || topicIndex === 0,
                onSelect: () => reorderTopics.mutate({ orderedIds: reorderedIds(topicIds, topicIndex, -1) }),
              },
              {
                label: "Переместить вниз",
                disabled: reorderTopics.isPending || topicIndex === topics.length - 1,
                onSelect: () => reorderTopics.mutate({ orderedIds: reorderedIds(topicIds, topicIndex, 1) }),
              },
            ]}
          />
        </li>
      ))}
    </ol>
  );
}
