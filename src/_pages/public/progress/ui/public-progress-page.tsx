"use client";

import { useQuery } from "@tanstack/react-query";
import { ChartNoAxesCombined, Link2Off } from "lucide-react";

import { CurrentProgressOverview, publicProgressQueries, type PublicCurrentProgress } from "@/entities/progress";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function PublicProgressPage({ token }: Readonly<{ token: string }>) {
  const progress = useQuery(publicProgressQueries.detail(token));

  return (
    <main className="app-container app-content page-stack">
      <header className="pb-2">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary sm:size-12">
            <ChartNoAxesCombined size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">Умнее Вместе</p>
            <h1 className="page-title mt-1">Текущий прогресс ученика</h1>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Актуальные результаты обучения по публичной ссылке преподавателя.
            </p>
          </div>
        </div>
      </header>

      <section className="min-w-0">
        {progress.isPending && <LoadingState />}
        {progress.isError && <ErrorState error={progress.error} onRetry={() => progress.refetch()} />}
        {progress.data && !hasLearningData(progress.data) && <EmptyState />}
        {progress.data && hasLearningData(progress.data) && (
          <CurrentProgressOverview progress={progress.data} audience="parent" />
        )}
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Загружаем прогресс">
      <div className="h-6 w-44 motion-safe:animate-pulse rounded-inset bg-surface-hover" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-36 motion-safe:animate-pulse rounded-surface bg-surface-subtle" />
        ))}
      </div>
      <p className="text-sm text-foreground-muted">Загружаем прогресс…</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: Readonly<{ error: Error; onRetry: () => void }>) {
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
    <div className="rounded-surface border border-danger-border bg-danger-subtle p-6 text-center" role="alert">
      <p className="font-semibold text-foreground">Не удалось загрузить прогресс</p>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">Произошла ошибка сервера. Попробуйте ещё раз.</p>
      <Button className="mt-5" type="button" variant="secondary" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

function StatusMessage({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div className="rounded-surface border border-border bg-surface-subtle p-6 text-center" role="alert">
      <Link2Off className="mx-auto text-foreground-subtle" size={30} aria-hidden="true" />
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">{description}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-surface border border-dashed border-border bg-surface-subtle/80 p-8 text-center sm:p-10">
      <ChartNoAxesCombined className="mx-auto text-primary" size={30} aria-hidden="true" />
      <p className="mt-4 font-semibold text-foreground">Учебных данных пока нет</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">
        Результаты появятся здесь после начала занятий.
      </p>
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
