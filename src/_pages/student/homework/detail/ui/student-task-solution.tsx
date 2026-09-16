"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { StudentHomeworkItem } from "@/entities/homework";
import {
  executionStatusPresentation,
  studentSubmissionQueries,
  submissionStatusPresentation,
  type StudentSubmission,
} from "@/entities/submission";
import { useRunStudentCodeMutation } from "@/features/execution/run-code";
import { useSubmitCodeAnswerMutation } from "@/features/submission/submit-code";
import { useSubmitTextAnswerMutation } from "@/features/submission/submit-text";
import { SafeMarkdown } from "@/entities/material/ui/safe-markdown";
import { Button } from "@/shared/ui/button";

type HomeworkStatus = "ASSIGNED" | "COMPLETED" | "CANCELLED";

export function StudentTaskSolution({
  homeworkId,
  homeworkStatus,
  item,
}: Readonly<{
  homeworkId: string;
  homeworkStatus: HomeworkStatus;
  item: StudentHomeworkItem;
}>) {
  const submissions = useQuery(studentSubmissionQueries.list(item.taskId, item.id));
  const readOnly = homeworkStatus === "CANCELLED";

  return (
    <section className="space-y-6 rounded-lg border bg-white p-6" aria-labelledby={`task-${item.id}-heading`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1">{item.task.taskType}</span>
          <span>{item.required ? "Обязательное" : "Дополнительное"}</span>
          <span>{item.passed ? "Выполнено" : "Не выполнено"}</span>
        </div>
        <h2 className="text-xl font-semibold" id={`task-${item.id}-heading`}>
          {item.task.title}
        </h2>
        <SafeMarkdown>{item.task.descriptionMarkdown}</SafeMarkdown>
      </div>
      {readOnly && (
        <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">
          Домашнее задание отменено. Новые решения недоступны.
        </p>
      )}
      {item.task.taskType === "TEXT" && <TextSolution disabled={readOnly} homeworkId={homeworkId} item={item} />}
      {item.task.taskType === "CODE" && <CodeSolution disabled={readOnly} homeworkId={homeworkId} item={item} />}
      {item.task.taskType !== "TEXT" && item.task.taskType !== "CODE" && (
        <p className="rounded-md bg-neutral-100 p-3 text-sm">Этот тип задания пока не поддерживается.</p>
      )}
      <SubmissionHistory submissions={submissions.data?.items ?? []} />
    </section>
  );
}

function TextSolution({
  homeworkId,
  item,
  disabled,
}: Readonly<{ homeworkId: string; item: StudentHomeworkItem; disabled: boolean }>) {
  const [textAnswer, setTextAnswer] = useState("");
  const submit = useSubmitTextAnswerMutation(homeworkId);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!textAnswer.trim() || submit.isPending || disabled) return;
        submit.mutate({ taskId: item.taskId, homeworkItemId: item.id, textAnswer });
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
      {submit.isError && (
        <p className="text-sm text-red-700" role="alert">
          Не удалось отправить ответ. Попробуйте ещё раз.
        </p>
      )}
      {submit.data && <SubmissionSummary submission={submit.data} />}
      <Button disabled={disabled || submit.isPending || !textAnswer.trim()} type="submit">
        {submit.isPending ? "Отправляем…" : "Отправить"}
      </Button>
    </form>
  );
}

function CodeSolution({
  homeworkId,
  item,
  disabled,
}: Readonly<{ homeworkId: string; item: StudentHomeworkItem; disabled: boolean }>) {
  const config = item.task.codeExecution;
  const [sourceCode, setSourceCode] = useState(config?.starterCode ?? "");
  const run = useRunStudentCodeMutation();
  const submit = useSubmitCodeAnswerMutation(homeworkId);

  if (!config)
    return (
      <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">Для задания недоступна конфигурация запуска.</p>
    );

  const executionDisabled = disabled || !config.executionEnabled;
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">Язык: {languagePresentation[config.language] ?? config.language}</p>
      {!config.executionEnabled && (
        <p className="text-sm text-neutral-600">Запуск и отправка кода сейчас недоступны.</p>
      )}
      <label className="block space-y-2" htmlFor={`source-${item.id}`}>
        <span className="font-medium">Код решения</span>
        <textarea
          className="min-h-72 w-full overflow-auto rounded-md border border-neutral-300 p-3 font-mono text-sm whitespace-pre"
          disabled={executionDisabled}
          id={`source-${item.id}`}
          onChange={(event) => setSourceCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            event.preventDefault();
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            setSourceCode(`${sourceCode.slice(0, start)}\t${sourceCode.slice(end)}`);
            requestAnimationFrame(() => target.setSelectionRange(start + 1, start + 1));
          }}
          spellCheck={false}
          value={sourceCode}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={executionDisabled || run.isPending}
          onClick={() => run.mutate({ taskId: item.taskId, homeworkItemId: item.id, sourceCode })}
          type="button"
        >
          {run.isPending ? "Запускаем…" : "Запустить"}
        </Button>
        <Button
          className="bg-blue-700 hover:bg-blue-600"
          disabled={executionDisabled || submit.isPending}
          onClick={() => submit.mutate({ taskId: item.taskId, homeworkItemId: item.id, sourceCode })}
          type="button"
        >
          {submit.isPending ? "Отправляем…" : "Отправить решение"}
        </Button>
      </div>
      {run.isError && (
        <p className="text-sm text-red-700" role="alert">
          Не удалось запустить код. Попробуйте ещё раз.
        </p>
      )}
      {submit.isError && (
        <p className="text-sm text-red-700" role="alert">
          Не удалось отправить решение. Попробуйте ещё раз.
        </p>
      )}
      {run.data && <RunResult result={run.data} />}
      {submit.data && <SubmissionSummary submission={submit.data} />}
    </div>
  );
}

function RunResult({ result }: Readonly<{ result: ReturnType<typeof useRunStudentCodeMutation>["data"] }>) {
  if (!result) return null;
  return (
    <section className="space-y-3 rounded-md border border-neutral-200 p-4" aria-label="Результат запуска">
      <p className="font-medium">{executionStatusPresentation[result.status]}</p>
      {result.passedTests !== undefined && result.totalTests !== undefined && (
        <p>
          Тесты: {result.passedTests} из {result.totalTests}
        </p>
      )}
      {result.executionTimeMs !== undefined && <p>Время выполнения: {result.executionTimeMs} мс</p>}
      {result.tests && result.tests.length > 0 && (
        <ul className="space-y-1 text-sm">
          {result.tests.map((test) => (
            <li key={test.position}>
              {test.hidden ? "Скрытый тест" : `Тест ${test.position + 1}`} · {test.passed ? "пройден" : "не пройден"}
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
  return (
    <p className="text-sm" role="status">
      {submissionStatusPresentation[submission.status]}
      {submission.execution ? ` · ${executionStatusPresentation[submission.execution.status]}` : ""}
    </p>
  );
}

function SubmissionHistory({ submissions }: Readonly<{ submissions: StudentSubmission[] }>) {
  if (submissions.length === 0) return null;
  return (
    <section className="border-t pt-4" aria-label="Попытки">
      <h3 className="font-medium">Попытки</h3>
      <ul className="mt-2 space-y-1 text-sm text-neutral-700">
        {submissions.map((submission) => (
          <li key={submission.id}>
            Попытка {submission.attemptNo} · {submissionStatusPresentation[submission.status]}
            {submission.execution ? ` · ${executionStatusPresentation[submission.execution.status]}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Output({ label, value }: Readonly<{ label: string; value: string | undefined }>) {
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

const languagePresentation: Record<string, string> = {
  PYTHON: "Python",
};
