"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudentProgramDetail, studentProgramQueries, type ProgramTopic } from "@/entities/student-program";
import { AssignLearningProgramDialog } from "@/features/program/assign";
import { useStudentTopicAccessMutation, type StudentTopicAccessStatus } from "@/features/program/student-topic-access";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

function canManageTopicAccess(topic: ProgramTopic): boolean {
  return topic.topicStatus === "ACTIVE" && (topic.progressStatus === "LOCKED" || topic.progressStatus === "AVAILABLE");
}

function accessErrorMessage(error: Error | null): string {
  if (error instanceof ApiClientError) {
    if (error.body.code === "STUDENT_TOPIC_ACCESS_CONFLICT") {
      return "Не удалось изменить доступ: одна из тем уже начата, завершена или недоступна для изменения.";
    }

    if (error.status === 404) {
      return "Программа или одна из выбранных тем больше не найдена.";
    }
  }

  return "Не удалось изменить доступ к темам.";
}

export function TeacherStudentProgramDetailView({
  studentId,
  studentProgramId,
}: Readonly<{
  studentId: string;
  studentProgramId: string;
}>) {
  const program = useQuery(studentProgramQueries.detail(studentId, studentProgramId));

  const accessMutation = useStudentTopicAccessMutation(studentId, studentProgramId);

  const router = useRouter();

  const [accessMode, setAccessMode] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(() => new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const manageableTopics = useMemo(
    () => program.data?.modules.flatMap((module) => module.topics).filter(canManageTopicAccess) ?? [],
    [program.data],
  );

  const selectedTopics = useMemo(
    () => manageableTopics.filter((topic) => selectedTopicIds.has(topic.id)),
    [manageableTopics, selectedTopicIds],
  );

  const hasLockedSelected = selectedTopics.some((topic) => topic.progressStatus === "LOCKED");

  const hasAvailableSelected = selectedTopics.some((topic) => topic.progressStatus === "AVAILABLE");

  const allManageableSelected =
    manageableTopics.length > 0 && manageableTopics.every((topic) => selectedTopicIds.has(topic.id));

  function toggleTopic(topicId: string, checked: boolean) {
    setSuccessMessage(null);

    setSelectedTopicIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(topicId);
      } else {
        next.delete(topicId);
      }

      return next;
    });
  }

  function toggleAccessMode() {
    setAccessMode((current) => !current);
    setSelectedTopicIds(new Set());
    setSuccessMessage(null);
    accessMutation.reset();
  }

  function toggleSelectAll() {
    setSuccessMessage(null);

    if (allManageableSelected) {
      setSelectedTopicIds(new Set());
      return;
    }

    setSelectedTopicIds(new Set(manageableTopics.map((topic) => topic.id)));
  }

  function updateAccess(status: StudentTopicAccessStatus) {
    if (selectedTopicIds.size === 0) {
      return;
    }

    setSuccessMessage(null);

    accessMutation.mutate(
      {
        status,
        topicIds: [...selectedTopicIds],
      },
      {
        onSuccess: () => {
          setSelectedTopicIds(new Set());

          setSuccessMessage(
            status === "AVAILABLE" ? "Доступ к выбранным темам открыт." : "Выбранные темы заблокированы.",
          );
        },
      },
    );
  }

  return (
    <main className="page-stack">
      <Link
        className="text-sm text-foreground-muted underline underline-offset-4"
        href={`/teacher/students/${studentId}/program`}
      >
        ← Программы ученика
      </Link>

      {program.isPending && (
        <p className="rounded-inset border border-border bg-surface p-5 text-foreground-muted" aria-busy="true">
          Загружаем программу…
        </p>
      )}

      {program.isError && (
        <div className="space-y-3 rounded-inset border border-danger-border bg-danger-subtle p-5" role="alert">
          <h1 className="page-title">
            {program.error instanceof ApiClientError && program.error.status === 404
              ? "Программа не найдена"
              : "Не удалось загрузить программу."}
          </h1>

          {!(program.error instanceof ApiClientError && program.error.status === 404) && (
            <Button type="button" onClick={() => program.refetch()}>
              Повторить
            </Button>
          )}
        </div>
      )}

      {program.data && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant={accessMode ? "ghost" : "secondary"} onClick={toggleAccessMode}>
              {accessMode ? "Завершить управление доступом" : "Управлять доступом к темам"}
            </Button>

            <AssignLearningProgramDialog
              studentId={studentId}
              triggerLabel="Назначить ещё программу"
              onAssigned={(created) => router.push(`/teacher/students/${studentId}/programs/${created.id}`)}
            />
          </div>

          {accessMode && (
            <section
              aria-label="Управление доступом к темам"
              className="sticky top-[calc(var(--app-header-height)+0.5rem)] z-20 rounded-surface border border-primary-border bg-surface/95 p-4 backdrop-blur"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">Выбрано: {selectedTopicIds.size}</p>

                  <p className="mt-1 text-sm text-foreground-muted">Начатые и завершённые темы изменять нельзя.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={manageableTopics.length === 0 || accessMutation.isPending}
                    onClick={toggleSelectAll}
                  >
                    {allManageableSelected ? "Снять выбор" : "Выбрать доступные для управления"}
                  </Button>

                  <Button
                    type="button"
                    disabled={accessMutation.isPending || !hasLockedSelected}
                    onClick={() => updateAccess("AVAILABLE")}
                  >
                    {accessMutation.isPending ? "Сохраняем…" : "Открыть выбранные"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={accessMutation.isPending || !hasAvailableSelected}
                    onClick={() => updateAccess("LOCKED")}
                  >
                    Заблокировать выбранные
                  </Button>
                </div>
              </div>

              {successMessage && (
                <p className="mt-3 text-sm font-medium text-success" role="status">
                  {successMessage}
                </p>
              )}

              {accessMutation.isError && (
                <p className="mt-3 text-sm font-medium text-danger" role="alert">
                  {accessErrorMessage(accessMutation.error)}
                </p>
              )}
            </section>
          )}

          <StudentProgramDetail
            program={program.data}
            studentId={studentId}
            topicSelection={{
              enabled: accessMode,
              selectedTopicIds,
              isSelectable: canManageTopicAccess,
              onToggle: toggleTopic,
            }}
          />
        </>
      )}
    </main>
  );
}
