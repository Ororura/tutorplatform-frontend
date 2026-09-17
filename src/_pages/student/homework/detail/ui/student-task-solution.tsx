"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { StudentHomeworkItem } from "@/entities/homework";
import { SafeMarkdown } from "@/entities/material/ui/safe-markdown";
import {
  executionStatusPresentation,
  studentSubmissionQueries,
  submissionStatusPresentation,
  type ExecutionStatus,
  type StudentSubmission,
} from "@/entities/submission";
import { useRunStudentCodeMutation } from "@/features/execution/run-code";
import { useSubmitCodeAnswerMutation } from "@/features/submission/submit-code";
import { useSubmitTextAnswerMutation } from "@/features/submission/submit-text";
import { Button } from "@/shared/ui/button";

type HomeworkStatus = "ASSIGNED" | "COMPLETED" | "CANCELLED";

type SolutionProps = Readonly<{
  homeworkId: string;
  homeworkStatus: HomeworkStatus;
  item: StudentHomeworkItem;
}>;

export function StudentTaskSolution({ homeworkId, homeworkStatus, item }: SolutionProps) {
  const submissions = useQuery(studentSubmissionQueries.list(item.taskId, item.id));

  const readOnly = homeworkStatus !== "ASSIGNED";

  return (
    <section className="space-y-6 rounded-lg border bg-white p-6" aria-labelledby={`task-${item.id}-heading`}>
      <TaskHeader item={item} />

      {readOnly && (
        <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">
          {homeworkStatus === "CANCELLED"
            ? "Домашнее задание отменено. Новые решения недоступны."
            : "Домашнее задание завершено. Новые решения недоступны."}
        </p>
      )}

      {item.task.taskType === "TEXT" && <TextSolution disabled={readOnly} homeworkId={homeworkId} item={item} />}

      {item.task.taskType === "CODE" && <CodeSolution disabled={readOnly} homeworkId={homeworkId} item={item} />}

      {item.task.taskType !== "TEXT" && item.task.taskType !== "CODE" && (
        <p className="rounded-md bg-neutral-100 p-3 text-sm">Этот тип задания пока не поддерживается.</p>
      )}

      {submissions.isError && (
        <p className="text-sm text-red-700" role="alert">
          Не удалось загрузить историю попыток.
        </p>
      )}

      <SubmissionHistory submissions={submissions.data?.items ?? []} />
    </section>
  );
}

function TaskHeader({ item }: Readonly<{ item: StudentHomeworkItem }>) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1">
          {taskTypePresentation[item.task.taskType] ?? item.task.taskType}
        </span>

        <span>{item.required ? "Обязательное" : "Дополнительное"}</span>

        <span>{item.passed ? "Выполнено" : "Не выполнено"}</span>
      </div>

      <h2 className="text-xl font-semibold" id={`task-${item.id}-heading`}>
        {item.task.title}
      </h2>

      <SafeMarkdown>{item.task.descriptionMarkdown}</SafeMarkdown>
    </div>
  );
}

function TextSolution({
  homeworkId,
  item,
  disabled,
}: Readonly<{
  homeworkId: string;
  item: StudentHomeworkItem;
  disabled: boolean;
}>) {
  const [textAnswer, setTextAnswer] = useState("");
  const submit = useSubmitTextAnswerMutation(homeworkId);

  const empty = !textAnswer.trim();
  const submitDisabled = disabled || submit.isPending || empty;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();

        if (submitDisabled) return;

        submit.mutate({
          taskId: item.taskId,
          homeworkItemId: item.id,
          textAnswer: textAnswer.trim(),
        });
      }}
    >
      <label className="block space-y-2" htmlFor={`answer-${item.id}`}>
        <span className="font-medium">Ваш ответ</span>

        <textarea
          className="min-h-40 w-full rounded-md border border-neutral-300 p-3"
          disabled={disabled || submit.isPending}
          id={`answer-${item.id}`}
          onChange={(event) => setTextAnswer(event.target.value)}
          value={textAnswer}
        />
      </label>

      <MutationError visible={submit.isError} message="Не удалось отправить ответ. Попробуйте ещё раз." />

      {submit.data && <SubmissionSummary submission={submit.data} />}

      <Button disabled={submitDisabled} type="submit">
        {submit.isPending ? "Отправляем…" : "Отправить"}
      </Button>
    </form>
  );
}

function CodeSolution({
  homeworkId,
  item,
  disabled,
}: Readonly<{
  homeworkId: string;
  item: StudentHomeworkItem;
  disabled: boolean;
}>) {
  const config = item.task.codeExecution;

  const [sourceCode, setSourceCode] = useState(config?.starterCode ?? "");

  const run = useRunStudentCodeMutation();
  const submit = useSubmitCodeAnswerMutation(homeworkId);

  if (!config) {
    return (
      <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">Для задания недоступна конфигурация запуска.</p>
    );
  }

  const busy = run.isPending || submit.isPending;
  const emptySource = !sourceCode.trim();

  const executionDisabled = disabled || !config.executionEnabled;

  const actionsDisabled = executionDisabled || busy || emptySource;

  const handleRun = () => {
    if (actionsDisabled) return;

    // Не показываем старый submission рядом
    // с результатом нового обычного запуска.
    submit.reset();

    run.mutate({
      taskId: item.taskId,
      homeworkItemId: item.id,
      sourceCode,
    });
  };

  const handleSubmit = () => {
    if (actionsDisabled) return;

    // После отправки решения результат "Запустить"
    // уже не должен выглядеть как актуальный.
    run.reset();

    submit.mutate({
      taskId: item.taskId,
      homeworkItemId: item.id,
      sourceCode,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
        <span>Язык: {languagePresentation[config.language] ?? config.language}</span>

        {config.timeLimitMs !== undefined && <span>Лимит времени: {config.timeLimitMs} мс</span>}

        {config.memoryLimitMb !== undefined && <span>Память: {config.memoryLimitMb} МБ</span>}
      </div>

      {!config.executionEnabled && (
        <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">
          Запуск и отправка кода сейчас недоступны.
        </p>
      )}

      <label className="block space-y-2" htmlFor={`source-${item.id}`}>
        <span className="font-medium">Код решения</span>

        <textarea
          className="min-h-72 w-full overflow-auto rounded-md border border-neutral-300 p-3 font-mono text-sm whitespace-pre"
          disabled={executionDisabled || busy}
          id={`source-${item.id}`}
          onChange={(event) => setSourceCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;

            event.preventDefault();

            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            setSourceCode((current) => `${current.slice(0, start)}\t${current.slice(end)}`);

            requestAnimationFrame(() => {
              target.setSelectionRange(start + 1, start + 1);
            });
          }}
          spellCheck={false}
          value={sourceCode}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button disabled={actionsDisabled} onClick={handleRun} type="button">
          {run.isPending ? "Запускаем…" : "Запустить"}
        </Button>

        <Button
          className="bg-blue-700 hover:bg-blue-600"
          disabled={actionsDisabled}
          onClick={handleSubmit}
          type="button"
        >
          {submit.isPending ? "Проверяем решение…" : "Отправить решение"}
        </Button>
      </div>

      <MutationError visible={run.isError} message="Не удалось запустить код. Попробуйте ещё раз." />

      <MutationError visible={submit.isError} message="Не удалось отправить решение. Попробуйте ещё раз." />

      {run.data && <RunResult result={run.data} />}

      {submit.data && <SubmissionSummary submission={submit.data} />}
    </div>
  );
}

function RunResult({
  result,
}: Readonly<{
  result: ReturnType<typeof useRunStudentCodeMutation>["data"];
}>) {
  if (!result) return null;

  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 p-4"
      aria-label="Результат запуска"
      aria-live="polite"
    >
      <ExecutionStatus status={result.status} />

      {result.passedTests !== undefined && result.totalTests !== undefined && (
        <p className="text-sm">
          Тесты:{" "}
          <strong>
            {result.passedTests} из {result.totalTests}
          </strong>
        </p>
      )}

      {result.executionTimeMs !== undefined && (
        <p className="text-sm text-neutral-600">Время выполнения: {result.executionTimeMs} мс</p>
      )}

      {result.tests && result.tests.length > 0 && (
        <ul className="space-y-1 text-sm">
          {result.tests.map((test) => (
            <li key={test.position}>
              {test.hidden ? "Скрытый тест" : `Тест ${test.position + 1}`}
              {" · "}
              <span className={test.passed ? "text-green-700" : "text-red-700"}>
                {test.passed ? "пройден" : "не пройден"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Output label="stdout" value={result.stdoutExcerpt} />
      <Output label="stderr" value={result.stderrExcerpt} />
    </section>
  );
}

function SubmissionSummary({ submission }: Readonly<{ submission: StudentSubmission }>) {
  const execution = submission.execution;

  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 p-4"
      aria-label="Результат отправки"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{submissionStatusPresentation[submission.status] ?? submission.status}</p>

        <span className="text-sm text-neutral-500">Попытка {submission.attemptNo}</span>
      </div>

      {execution && (
        <>
          <ExecutionStatus status={execution.status} />

          <p className="text-sm">
            Тесты:{" "}
            <strong>
              {execution.passedTests} из {execution.totalTests}
            </strong>
          </p>

          <p className="text-sm text-neutral-600">Время выполнения: {execution.executionTimeMs} мс</p>

          <Output label="stdout" value={execution.stdoutExcerpt} />

          <Output label="stderr" value={execution.stderrExcerpt} />
        </>
      )}
    </section>
  );
}

function ExecutionStatus({ status }: Readonly<{ status: ExecutionStatus }>) {
  const presentation = executionStatusPresentation[status] ?? status;

  switch (status) {
    case "PASSED":
      return <p className="font-medium text-green-700">Решение принято</p>;

    case "FAILED":
      return <p className="font-medium text-red-700">Решение не прошло все тесты</p>;

    case "TIMEOUT":
      return <p className="font-medium text-red-700">Превышен лимит времени</p>;

    case "RUNTIME_ERROR":
      return <p className="font-medium text-red-700">Программа завершилась с ошибкой</p>;

    case "SYSTEM_ERROR":
      return <p className="font-medium text-red-700">Не удалось проверить решение. Попробуйте ещё раз.</p>;

    default:
      return <p className="font-medium">{presentation}</p>;
  }
}

function SubmissionHistory({ submissions }: Readonly<{ submissions: StudentSubmission[] }>) {
  if (submissions.length === 0) return null;

  return (
    <section className="border-t pt-4" aria-label="История попыток">
      <h3 className="font-medium">Попытки</h3>

      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
        {submissions.map((submission) => (
          <li className="flex flex-wrap items-center gap-x-2" key={submission.id}>
            <span>Попытка {submission.attemptNo}</span>

            <span aria-hidden="true">·</span>

            <span>{submissionStatusPresentation[submission.status] ?? submission.status}</span>

            {submission.execution && (
              <>
                <span aria-hidden="true">·</span>

                <span>
                  {submission.execution.passedTests}/{submission.execution.totalTests} тестов
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Output({
  label,
  value,
}: Readonly<{
  label: string;
  value: string | null | undefined;
}>) {
  if (!value) return null;

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>

      <pre className="max-h-48 overflow-auto rounded bg-neutral-950 p-3 text-sm text-neutral-100 whitespace-pre-wrap">
        {value}
      </pre>
    </div>
  );
}

function MutationError({
  visible,
  message,
}: Readonly<{
  visible: boolean;
  message: string;
}>) {
  if (!visible) return null;

  return (
    <p className="text-sm text-red-700" role="alert">
      {message}
    </p>
  );
}

const languagePresentation: Record<string, string> = {
  PYTHON: "Python",
};

const taskTypePresentation: Record<string, string> = {
  TEXT: "Текст",
  CODE: "Код",
};
