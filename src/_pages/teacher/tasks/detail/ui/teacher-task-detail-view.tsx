"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { taskDifficultyPresentation, taskQueries, taskStatusPresentation, taskTypePresentation } from "@/entities/task";
import { SafeMarkdown } from "@/entities/material";
import { EditTaskDialog } from "@/features/task/edit";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

export function TeacherTaskDetailView({ taskId }: Readonly<{ taskId: string }>) {
  const task = useQuery(taskQueries.detail(taskId));
  const subjects = useQuery(taskQueries.subjects());
  if (task.isPending)
    return (
      <main className="page-stack min-w-0">
        <p className="rounded-surface bg-surface-subtle p-6 text-sm text-foreground-muted" aria-busy="true">
          Загружаем задание…
        </p>
      </main>
    );
  if (task.isError) {
    const notFound = task.error instanceof ApiClientError && task.error.status === 404;
    return (
      <main className="page-stack min-w-0">
        <div
          className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5 text-sm text-danger"
          role="alert"
        >
          <p>{notFound ? "Задание не найдено" : "Не удалось загрузить задание."}</p>
          {!notFound && (
            <Button type="button" variant="secondary" onClick={() => task.refetch()}>
              Повторить
            </Button>
          )}
        </div>
        <Link className="underline" href="/teacher/tasks">
          Вернуться в банк заданий
        </Link>
      </main>
    );
  }
  const subject = subjects.data?.find((item) => item.id === task.data.subjectId);
  const tests = [...(task.data.testCases ?? [])].sort((a, b) => a.position - b.position);
  return (
    <main className="page-stack min-w-0">
      <div>
        <Link className="text-sm text-foreground-muted underline" href="/teacher/tasks">
          ← Банк заданий
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title wrap-break-word">{task.data.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span>{taskTypePresentation[task.data.taskType]}</span>
              <span>·</span>
              <span>{taskDifficultyPresentation[task.data.difficulty]}</span>
              <span>·</span>
              <span>{taskStatusPresentation[task.data.status]}</span>
              {subject && (
                <>
                  <span>·</span>
                  <span>{subject.name}</span>
                </>
              )}
            </div>
          </div>
          <EditTaskDialog task={task.data} />
        </div>
      </div>
      <section className="rounded-inset border border-border bg-surface p-6" aria-labelledby="description-heading">
        <h2 id="description-heading" className="section-title mb-4">
          Описание
        </h2>
        <SafeMarkdown>{task.data.descriptionMarkdown}</SafeMarkdown>
      </section>
      {task.data.taskType === "CODE" && task.data.programmingConfig && (
        <section
          className="space-y-4 rounded-inset border border-border bg-surface p-6"
          aria-labelledby="config-heading"
        >
          <h2 id="config-heading" className="section-title">
            Конфигурация кода
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground-muted">Язык</dt>
              <dd>{task.data.programmingConfig.language}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Выполнение</dt>
              <dd>{task.data.programmingConfig.executionEnabled ? "Разрешено" : "Отключено"}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Лимит времени</dt>
              <dd>{task.data.programmingConfig.timeLimitMs} мс</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Лимит памяти</dt>
              <dd>{task.data.programmingConfig.memoryLimitMb} МБ</dd>
            </div>
          </dl>
          {task.data.programmingConfig.starterCode && (
            <div>
              <h3 className="mb-2 font-medium">Стартовый код</h3>
              <pre className="overflow-x-auto rounded-control bg-code-surface p-4 text-sm text-code-foreground">
                <code>{task.data.programmingConfig.starterCode}</code>
              </pre>
            </div>
          )}
        </section>
      )}
      {task.data.taskType === "CODE" && tests.length > 0 && (
        <section className="space-y-4" aria-labelledby="tests-heading">
          <h2 id="tests-heading" className="section-title">
            Тесты
          </h2>
          <ol className="space-y-3">
            {tests.map((test) => (
              <li className="rounded-inset border border-border bg-surface p-4" key={test.id}>
                <div className="mb-3 flex justify-between gap-3">
                  <span className="font-medium">Тест {test.position + 1}</span>
                  <span className="text-xs text-foreground-muted">
                    {test.hidden ? "Скрытый" : "Открытый"} · {test.comparisonMode}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-foreground-muted">Ввод</p>
                    <pre className="overflow-x-auto rounded bg-surface-subtle p-3 text-sm">{test.inputText ?? "—"}</pre>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-foreground-muted">Ожидаемый вывод</p>
                    <pre className="overflow-x-auto rounded bg-surface-subtle p-3 text-sm">{test.expectedOutput}</pre>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
