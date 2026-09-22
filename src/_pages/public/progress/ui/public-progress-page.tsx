"use client";

import { useQuery } from "@tanstack/react-query";
import { ChartNoAxesCombined, Link2Off } from "lucide-react";

import { CurrentProgressOverview, publicProgressQueries, type PublicCurrentProgress } from "@/entities/progress";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function PublicProgressPage({ token }: Readonly<{ token: string }>) {
  const progress = useQuery(publicProgressQueries.detail(token));

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:size-12">
            <ChartNoAxesCombined size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-600">Tutor Learning Platform</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Текущий прогресс ученика
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Актуальные результаты обучения по публичной ссылке преподавателя.
            </p>
          </div>
        </div>
      </header>

      <section className="mt-4 rounded-[28px] border border-white/80 bg-white/70 p-4 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:mt-6 sm:p-6">
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
      <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <p className="text-sm text-slate-500">Загружаем прогресс…</p>
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
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center" role="alert">
      <p className="font-semibold text-slate-950">Не удалось загрузить прогресс</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">Произошла ошибка сервера. Попробуйте ещё раз.</p>
      <Button className="mt-5" type="button" variant="secondary" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

function StatusMessage({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center" role="alert">
      <Link2Off className="mx-auto text-slate-400" size={30} aria-hidden="true" />
      <p className="mt-4 font-semibold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center sm:p-10">
      <ChartNoAxesCombined className="mx-auto text-blue-500" size={30} aria-hidden="true" />
      <p className="mt-4 font-semibold text-slate-950">Учебных данных пока нет</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
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
