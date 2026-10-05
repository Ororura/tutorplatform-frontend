"use client";
import { Select } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, ChartNoAxesCombined, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CurrentProgressOverview, progressQueries } from "@/entities/progress";
import { studentProgramQueries } from "@/entities/student-program";
import { Button, buttonClassName } from "@/shared/ui/button";

export function StudentProgressView() {
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const programs = useQuery(studentProgramQueries.currentList());
  const selectedProgramExists = programs.data?.some((program) => program.id === selectedProgramId) ?? false;
  const activeProgramId = selectedProgramExists ? selectedProgramId : (programs.data?.[0]?.id ?? "");
  const progress = useQuery({
    ...progressQueries.currentStudent(activeProgramId),
    enabled: activeProgramId.length > 0,
  });

  return (
    <main className="page-content page-stack">
      <section className="py-2">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-surface bg-primary-subtle text-primary">
            <ChartNoAxesCombined size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">Учебный кабинет</p>
            <h1 className="page-title mt-1 wrap-break-word">Мой прогресс</h1>
            <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
              Следите за результатами обучения и продолжайте заниматься в своей программе.
            </p>
          </div>
        </div>
      </section>

      <section className="surface">
        {programs.isPending && <Loading label="Загружаем программы…" />}

        {programs.isError && (
          <RetryMessage message="Не удалось загрузить ваши программы." onRetry={() => programs.refetch()} />
        )}

        {programs.data?.length === 0 && (
          <EmptyState
            icon={BookOpenText}
            title="Программ пока нет"
            description="Когда преподаватель назначит программу обучения, здесь появится ваш прогресс."
            href="/student/programs"
            action="Перейти к программам"
          />
        )}

        {programs.data && programs.data.length > 0 && (
          <div className="space-y-6">
            <div className="max-w-xl">
              <label htmlFor="student-progress-program" className="text-sm font-medium text-foreground-muted">
                Программа обучения
              </label>
              <Select
                id="student-progress-program"
                className="mt-2"
                value={activeProgramId}
                disabled={programs.data.length === 1}
                onChange={(event) => setSelectedProgramId(event.target.value)}
              >
                {programs.data.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </Select>
            </div>

            {progress.isPending && <Loading label="Загружаем ваш прогресс…" />}

            {progress.isError && (
              <RetryMessage message="Не удалось загрузить ваш прогресс." onRetry={() => progress.refetch()} />
            )}

            {progress.data && !hasLearningData(progress.data) && (
              <EmptyState
                icon={ChartNoAxesCombined}
                title="Учебных данных пока нет"
                description="Начните заниматься по программе, и здесь появятся ваши результаты."
                href={`/student/programs/${activeProgramId}`}
                action="Продолжить обучение"
              />
            )}

            {progress.data && hasLearningData(progress.data) && (
              <div className="space-y-6">
                <CurrentProgressOverview progress={progress.data} audience="student" />

                <section className="grid gap-3 sm:grid-cols-2" aria-label="Продолжить обучение">
                  <Link className={buttonClassName("primary", "")} href={`/student/programs/${activeProgramId}`}>
                    Продолжить обучение
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-surface border border-border px-4 text-sm font-medium text-foreground-muted transition hover:border-primary-border hover:bg-primary-subtle"
                    href="/student/homework"
                  >
                    Открыть домашние задания
                    <ClipboardCheck size={16} aria-hidden="true" />
                  </Link>
                </section>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function hasLearningData(progress: {
  totalLearningMinutes?: number;
  sessionsCount?: number;
  attendanceRate?: number;
  totalTopics?: number;
  homework?: { assigned?: number; completed?: number };
  practice?: { assigned?: number; completed?: number };
  topics?: { completed?: unknown[]; inProgress?: unknown[] };
  assessment?: Record<string, number | null | undefined>;
}) {
  const metricValues = [
    progress.totalLearningMinutes,
    progress.sessionsCount,
    progress.attendanceRate,
    progress.totalTopics,
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

function Loading({ label }: Readonly<{ label: string }>) {
  return (
    <p className="rounded-surface bg-surface-subtle p-5 text-sm text-(--text-secondary)" aria-busy="true">
      {label}
    </p>
  );
}

function RetryMessage({ message, onRetry }: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
      <p className="text-sm text-danger">{message}</p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: Readonly<{
  icon: typeof BookOpenText;
  title: string;
  description: string;
  href: string;
  action: string;
}>) {
  return (
    <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
      <Icon size={30} className="mx-auto text-primary" aria-hidden="true" />
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-(--text-secondary)">{description}</p>
      <Link className={buttonClassName("primary", "mt-5")} href={href}>
        {action}
      </Link>
    </div>
  );
}
