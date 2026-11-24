"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2Off } from "lucide-react";

import { CurrentProgressOverview, publicProgressQueries, type PublicCurrentProgress } from "@/entities/progress";
import { ApiClientError } from "@/shared/api/client";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { PublicPageShell } from "../../ui/public-page-shell";

export function PublicProgressPage({ token }: Readonly<{ token: string }>) {
  const progress = useQuery(publicProgressQueries.detail(token));

  return (
    <PublicPageShell>
      <PageHeader
        title="Текущий прогресс ученика"
        description="Актуальные результаты обучения по публичной ссылке преподавателя."
      />

      <section className="min-w-0">
        {progress.isPending && <LoadingState label="Загружаем прогресс">Загружаем прогресс…</LoadingState>}
        {progress.isError && <ProgressError error={progress.error} onRetry={() => progress.refetch()} />}
        {progress.data && !hasLearningData(progress.data) && (
          <EmptyState title="Учебных данных пока нет" description="Результаты появятся здесь после начала занятий." />
        )}
        {progress.data && hasLearningData(progress.data) && (
          <CurrentProgressOverview progress={progress.data} audience="parent" />
        )}
      </section>
    </PublicPageShell>
  );
}

function ProgressError({ error, onRetry }: Readonly<{ error: Error; onRetry: () => void }>) {
  const status = error instanceof ApiClientError ? error.status : undefined;

  if (status === 404) {
    return (
      <StatusMessage
        title="Ссылка не найдена"
        description="Проверьте адрес ссылки или запросите новую у преподавателя."
      />
    );
  }

  if (status === 410) {
    return (
      <StatusMessage
        title="Ссылка больше не действует"
        description="Срок действия ссылки истёк или преподаватель отозвал доступ."
      />
    );
  }

  return (
    <ErrorState
      title="Не удалось загрузить прогресс"
      description="Произошла ошибка сервера. Попробуйте ещё раз."
      onRetry={onRetry}
    />
  );
}

function StatusMessage({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div className="surface text-center" role="alert">
      <Link2Off className="mx-auto text-foreground-subtle" size={30} aria-hidden="true" />
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">{description}</p>
    </div>
  );
}

function hasLearningData(progress: PublicCurrentProgress): boolean {
  const metricValues = [
    progress.totalLearningMinutes,
    progress.sessionsCount,
    progress.attendanceRate,
    progress.homework?.assigned,
    progress.homework?.completed,
    progress.practice?.assigned,
    progress.practice?.completed,
  ];

  return (
    metricValues.some((value) => value !== null && value !== undefined && value > 0) ||
    Boolean(progress.topics?.completed?.length) ||
    Boolean(progress.topics?.inProgress?.length) ||
    Object.values(progress.assessment ?? {}).some((value) => value !== null && value !== undefined)
  );
}
