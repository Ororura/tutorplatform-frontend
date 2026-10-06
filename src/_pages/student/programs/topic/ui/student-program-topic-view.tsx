"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpenText, ChevronRight, Code2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MaterialRenderer, SafeMarkdown } from "@/entities/material";
import {
  downloadStudentProgramMaterial,
  studentMaterialDownloadUrl,
  studentProgramQueries,
  type StudentProgramDetails,
} from "@/entities/student-program";
import { studentTopicTaskQueries } from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { StudentTaskSolution } from "@/widgets/student-task-solution";

type Props = { studentProgramId: string; topicId: string };

function errorStatus(error: unknown): number | undefined {
  return error instanceof ApiClientError ? error.status : (error as { status?: number } | null)?.status;
}

function errorCode(error: unknown): string | undefined {
  return error instanceof ApiClientError ? error.body.code : undefined;
}

export function StudentProgramTopicView({ studentProgramId, topicId }: Readonly<Props>) {
  const queryClient = useQueryClient();

  const topic = useQuery(studentProgramQueries.currentTopic(studentProgramId, topicId));

  const program = useQuery(studentProgramQueries.currentDetail(studentProgramId));

  const tasks = useQuery({
    ...studentTopicTaskQueries.list(studentProgramId, topicId),
    enabled: topic.isSuccess,
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [downloadErrorId, setDownloadErrorId] = useState<string | null>(null);

  const topicProgressStatus = topic.data?.progressStatus;

  useEffect(() => {
    if (!topicProgressStatus) {
      return;
    }

    queryClient.setQueryData<StudentProgramDetails>(
      studentProgramQueries.currentDetail(studentProgramId).queryKey,
      (current) => {
        if (!current) {
          return current;
        }

        let changed = false;

        const modules = current.modules.map((module) => ({
          ...module,
          topics: module.topics.map((item) => {
            if (item.id !== topicId || item.progressStatus === topicProgressStatus) {
              return item;
            }

            changed = true;

            return {
              ...item,
              progressStatus: topicProgressStatus,
            };
          }),
        }));

        return changed
          ? {
              ...current,
              modules,
            }
          : current;
      },
    );
  }, [queryClient, studentProgramId, topicId, topicProgressStatus]);

  const getStudentDownloadUrl = (material: { id: string }) =>
    studentMaterialDownloadUrl(studentProgramId, topicId, material.id);

  if (topic.isPending || program.isPending) {
    return (
      <main>
        <p
          className="rounded-surface border border-(--border) bg-surface p-6 text-sm text-(--text-secondary)"
          aria-busy="true"
        >
          Загружаем тему…
        </p>
      </main>
    );
  }

  if (topic.isError || program.isError) {
    const status = errorStatus(topic.error) ?? errorStatus(program.error);

    const code = errorCode(topic.error) ?? errorCode(program.error);

    const locked = code === "STUDENT_TOPIC_LOCKED";

    const title = locked
      ? "Тема пока заблокирована"
      : status === 403
        ? "Нет доступа к теме"
        : status === 404
          ? "Тема не найдена"
          : "Не удалось загрузить тему";

    return (
      <main className="page-content page-stack min-w-0">
        <section className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-6" role="alert">
          <h1 className="page-title">{title}</h1>
          <p className="text-sm leading-6 text-danger">
            {locked
              ? "Преподаватель ещё не открыл доступ к этой теме."
              : status === 403
                ? "Эта тема недоступна для вашей учётной записи."
                : status === 404
                  ? "Возможно, тема больше не входит в назначенную программу или ссылка устарела."
                  : "Попробуйте повторить запрос."}
          </p>
          {status !== 403 && status !== 404 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void topic.refetch();
                void program.refetch();
              }}
            >
              Повторить
            </Button>
          )}
        </section>
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary) transition hover:text-primary"
          href={`/student/programs/${studentProgramId}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Вернуться к программе
        </Link>
      </main>
    );
  }

  const topics = program.data.modules.flatMap((module) => module.topics);
  const topicIndex = topics.findIndex((item) => item.id === topic.data.id);
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;

  const nextTopic = topicIndex >= 0 ? topics[topicIndex + 1] : undefined;

  const previousTopicLocked = previousTopic?.progressStatus === "LOCKED";

  const nextTopicLocked = nextTopic?.progressStatus === "LOCKED";
  const practiceTasks = [...(tasks.data ?? [])].sort((left, right) => left.position - right.position);
  const selectedTask = practiceTasks.find((task) => task.id === selectedTaskId);

  return (
    <main className="page-content page-stack min-w-0">
      <section className="py-2">
        <nav aria-label="Хлебные крошки">
          <ol className="flex flex-wrap items-center wrap-break-word gap-x-2 gap-y-1 text-sm text-(--text-secondary)">
            <li className="min-w-0">
              <Link className="transition hover:text-primary" href="/student/programs">
                Мои программы
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="min-w-0">
              <Link className="transition hover:text-primary" href={`/student/programs/${studentProgramId}`}>
                {program.data.title}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>{topic.data.moduleTitle}</li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-foreground-muted" aria-current="page">
              {topic.data.title}
            </li>
          </ol>
        </nav>

        <div className="mt-6 flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">{topic.data.moduleTitle}</p>
            <h1 className="page-title mt-1 wrap-break-word">{topic.data.title}</h1>
            <div className="mt-4 text-sm text-foreground-muted">
              {topic.data.description ? (
                <SafeMarkdown>{topic.data.description}</SafeMarkdown>
              ) : (
                <p>Описание темы пока не добавлено.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="surface" aria-labelledby="topic-materials-heading">
        <h2 className="section-title" id="topic-materials-heading">
          Учебные материалы
        </h2>

        {topic.data.materials.length === 0 ? (
          <p className="mt-5 rounded-surface border border-dashed border-border bg-surface-subtle/60 p-8 text-center text-sm text-(--text-secondary)">
            Для этой темы пока нет материалов.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-border">
            {topic.data.materials.map((material) => (
              <li className="min-w-0 py-4" key={material.id}>
                <h3 className="mb-3 font-semibold text-foreground">{material.title}</h3>
                <div className="text-sm text-foreground-muted">
                  <MaterialRenderer
                    material={material}
                    getDownloadUrl={getStudentDownloadUrl}
                    onDownload={
                      material.materialType === "FILE"
                        ? (_downloadedMaterial, href) => {
                            setDownloadErrorId(null);
                            void downloadStudentProgramMaterial(href, material.title).catch(() => {
                              setDownloadErrorId(material.id);
                            });
                          }
                        : undefined
                    }
                  />
                  {downloadErrorId === material.id && (
                    <p className="mt-2 text-sm text-danger" role="alert">
                      Не удалось скачать файл. Попробуйте ещё раз.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="surface" aria-labelledby="topic-practice-heading">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
            <Code2 size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">Самостоятельная практика</p>
            <h2 className="section-title mt-1" id="topic-practice-heading">
              Практические задания
            </h2>
            <p className="mt-1 text-sm text-(--text-secondary)">Выберите задание и проверьте решение по тестам.</p>
          </div>
        </div>

        {tasks.isPending && (
          <p className="mt-5 rounded-surface bg-surface-subtle p-4 text-sm text-(--text-secondary)" aria-busy="true">
            Загружаем задания…
          </p>
        )}

        {tasks.isError && (
          <div
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-surface bg-danger-subtle p-4"
            role="alert"
          >
            <p className="text-sm text-danger">Не удалось загрузить практические задания.</p>
            <Button type="button" variant="secondary" onClick={() => void tasks.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {tasks.isSuccess && practiceTasks.length === 0 && (
          <p className="mt-5 rounded-surface border border-dashed border-border bg-surface-subtle/60 p-8 text-center text-sm text-(--text-secondary)">
            Для этой темы пока нет практических заданий.
          </p>
        )}

        {practiceTasks.length > 0 && (
          <ol className="mt-5 divide-y divide-border">
            {practiceTasks.map((task, index) => (
              <li className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center" key={task.id}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-surface bg-surface-subtle text-sm font-semibold text-(--text-secondary)">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{task.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground-muted">
                    <span className="rounded-full bg-surface-subtle px-2.5 py-1">
                      {task.taskType === "CODE" ? "Код" : "Текст"}
                    </span>
                    <span className="rounded-full bg-surface-subtle px-2.5 py-1">
                      {task.required ? "Обязательное" : "Дополнительное"}
                    </span>
                  </div>
                </div>
                <Button type="button" variant="secondary" onClick={() => setSelectedTaskId(task.id)}>
                  {selectedTaskId === task.id ? "Открыто" : "Решить"}
                  <ChevronRight className="ml-2" size={16} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {selectedTask && (
        <StudentTaskSolution key={selectedTask.id} practice={{ studentProgramId, topicId, task: selectedTask }} />
      )}

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Навигация по темам">
        {previousTopic && !previousTopicLocked ? (
          <Link
            className="flex items-center gap-3 rounded-surface border border-border p-4 transition hover:border-primary-border hover:bg-primary-subtle/40"
            href={`/student/programs/${studentProgramId}/topics/${previousTopic.id}`}
          >
            <ArrowLeft className="shrink-0 text-primary" size={18} aria-hidden="true" />

            <span className="min-w-0">
              <span className="block text-xs text-(--text-secondary)">Предыдущая тема</span>

              <span className="mt-1 block truncate font-medium text-foreground">{previousTopic.title}</span>
            </span>
          </Link>
        ) : previousTopicLocked ? (
          <p className="rounded-surface border border-dashed border-border bg-surface-subtle p-4 text-sm text-foreground-muted">
            Предыдущая тема заблокирована
          </p>
        ) : (
          <p className="rounded-surface border border-dashed border-border p-4 text-sm text-foreground-subtle">
            Предыдущей темы нет
          </p>
        )}

        {nextTopic && !nextTopicLocked ? (
          <Link
            className="flex items-center justify-between gap-3 rounded-surface border border-border p-4 text-right transition hover:border-primary-border hover:bg-primary-subtle/40"
            href={`/student/programs/${studentProgramId}/topics/${nextTopic.id}`}
          >
            <span className="min-w-0">
              <span className="block text-xs text-(--text-secondary)">Следующая тема</span>

              <span className="mt-1 block truncate font-medium text-foreground">{nextTopic.title}</span>
            </span>

            <ArrowRight className="shrink-0 text-primary" size={18} aria-hidden="true" />
          </Link>
        ) : nextTopicLocked ? (
          <p className="rounded-surface border border-dashed border-border bg-surface-subtle p-4 text-right text-sm text-foreground-muted">
            Следующая тема заблокирована
          </p>
        ) : (
          <p className="rounded-surface border border-dashed border-border p-4 text-right text-sm text-foreground-subtle">
            Следующей темы нет
          </p>
        )}
      </nav>
    </main>
  );
}
