"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { studentSubmissionQueries } from "@/entities/submission";
import { useCurrentUserQuery } from "@/entities/user";
import { useRunStudentCodeMutation } from "@/features/execution/run-code";
import { useSubmitCodeAnswerMutation } from "@/features/submission/submit-code";
import {
  parseWebFiles,
  parseWebManifest,
  webSource,
  webReviewModes,
  type WebFiles,
  type WebManifest,
} from "@/shared/lib/web-exercise";
import { Button } from "@/shared/ui/button";
import { WebFilesEditor } from "@/shared/ui/web-files-editor";
import { ApiClientError } from "@/shared/api/client";

type Props = {
  taskId: string;
  starterCode?: string | null;
  homeworkId?: string;
  disabled: boolean;
  latestSubmissionId?: string;
  context: { homeworkItemId: string } | { studentProgramId: string; topicId: string };
};

export function WebExerciseSolution(props: Readonly<Props>) {
  const user = useCurrentUserQuery();
  const latest = useQuery({
    ...studentSubmissionQueries.detail(props.latestSubmissionId ?? ""),
    enabled: !!props.latestSubmissionId,
  });
  const manifest = parseWebManifest(props.starterCode);
  if (!manifest) return <p role="alert">Некорректная конфигурация веб-упражнения. Обратитесь к преподавателю.</p>;
  if (user.isPending || (props.latestSubmissionId && latest.isPending))
    return <p aria-busy="true">Загружаем решение…</p>;
  if (!user.data || user.isError || latest.isError)
    return <p role="alert">Не удалось загрузить сохранённое решение.</p>;
  const draftKey = `web-exercise:${user.data.id}:${props.taskId}:${"homeworkItemId" in props.context ? props.context.homeworkItemId : props.context.studentProgramId + ":" + props.context.topicId}`;
  return (
    <SolutionEditor
      key={`${draftKey}:${props.starterCode}`}
      {...props}
      manifest={manifest}
      draftKey={draftKey}
      submittedFiles={parseWebFiles(latest.data?.sourceCode)}
      reviewComment={latest.data?.reviewComment}
    />
  );
}

function SolutionEditor({
  taskId,
  manifest,
  draftKey,
  context,
  homeworkId,
  disabled,
  submittedFiles,
  reviewComment,
}: Readonly<
  Props & { manifest: WebManifest; draftKey: string; submittedFiles: WebFiles | null; reviewComment?: string | null }
>) {
  const [storageError, setStorageError] = useState(false);
  const [files, setFiles] = useState<WebFiles>(() => {
    const restore = (saved: WebFiles): WebFiles => {
      if (disabled) return saved;
      return {
        html: manifest.editableFiles.includes("html") ? saved.html : manifest.html,
        css: manifest.editableFiles.includes("css") ? saved.css : manifest.css,
        javascript: manifest.editableFiles.includes("javascript") ? saved.javascript : manifest.javascript,
      };
    };
    if (!disabled) {
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) ?? "null");
        if (draft?.starter === webSource(manifest)) {
          const saved = parseWebFiles(JSON.stringify(draft.files));
          if (saved) return restore(saved);
        }
      } catch {
        /* A missing or unavailable local draft does not prevent solving. */
      }
    }
    return restore(submittedFiles ?? { html: manifest.html, css: manifest.css, javascript: manifest.javascript });
  });
  const run = useRunStudentCodeMutation();
  const submit = useSubmitCodeAnswerMutation(homeworkId);
  const busy = run.isPending || submit.isPending;
  const change = (next: WebFiles) => {
    setFiles(next);
    run.reset();
    submit.reset();
    try {
      localStorage.setItem(draftKey, JSON.stringify({ starter: webSource(manifest), files: next }));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  const result = run.data;
  const final = submit.data;
  const failure = run.error ?? submit.error;
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        {webReviewModes[manifest.reviewMode]}. Черновик сохраняется в этом браузере.
      </p>
      {manifest.criteria && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {manifest.criteria.map((label, i) => (
            <li key={i}>{label}</li>
          ))}
        </ul>
      )}
      {manifest.hint && (
        <details className="rounded-control border border-border p-3 text-sm">
          <summary>Подсказка</summary>
          <p className="mt-2">{manifest.hint}</p>
        </details>
      )}
      <WebFilesEditor
        files={files}
        editableFiles={manifest.editableFiles}
        onChange={change}
        disabled={disabled || busy}
      />
      {storageError && (
        <p role="alert" className="text-sm text-danger">
          Не удалось сохранить черновик в браузере. Скопируйте код перед закрытием страницы.
        </p>
      )}
      {!disabled && (
        <div className="flex flex-wrap gap-3">
          {manifest.reviewMode !== "MANUAL" && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                submit.reset();
                run.mutate({ taskId, ...context, sourceCode: webSource(files) });
              }}
            >
              {run.isPending ? "Проверяем…" : "Проверить"}
            </Button>
          )}
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              run.reset();
              submit.mutate({ taskId, ...context, sourceCode: webSource(files) });
            }}
          >
            {submit.isPending ? "Отправляем…" : "Отправить решение"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => change({ html: manifest.html, css: manifest.css, javascript: manifest.javascript })}
          >
            Сбросить код
          </Button>
        </div>
      )}
      {failure && (
        <p role="alert" className="text-sm text-danger">
          {failure instanceof ApiClientError && failure.status === 429
            ? "Слишком много проверок. Подождите немного и повторите."
            : "Не удалось проверить или отправить решение. Попробуйте ещё раз."}
        </p>
      )}
      {result && (
        <section
          aria-label="Результаты проверки"
          aria-live="polite"
          className="space-y-2 rounded-control border border-border p-4"
        >
          <p>
            Пройдено проверок: {result.passedTests} из {result.totalTests}
          </p>
          {result.status === "SYSTEM_ERROR" && <p role="alert">Среда проверки временно недоступна. Повторите позже.</p>}
          {result.status === "TIMEOUT" && (
            <p role="alert">Превышено время проверки. Проверьте, нет ли бесконечного цикла.</p>
          )}
          <ul>
            {result.tests?.map((test) => (
              <li key={test.position}>
                {test.passed ? "✓" : "✗"}{" "}
                {test.hidden
                  ? "Скрытая проверка"
                  : (manifest.criteria?.[test.position] ?? `Проверка ${test.position + 1}`)}
              </li>
            ))}
          </ul>
          {result.stderrExcerpt && (
            <pre className="overflow-auto whitespace-pre-wrap text-xs">{result.stderrExcerpt}</pre>
          )}
        </section>
      )}
      {final && (
        <p role="status">
          {final.status === "PASSED"
            ? "Упражнение выполнено!"
            : final.status === "NEEDS_REVIEW"
              ? "Решение отправлено преподавателю."
              : final.status === "SYSTEM_ERROR"
                ? "Решение сохранено, но проверка недоступна. Повторите отправку позже."
                : "Решение сохранено. Исправьте ошибки и отправьте новую попытку."}
        </p>
      )}
      {reviewComment && (
        <p className="rounded-control border border-border p-3 text-sm whitespace-pre-wrap">
          Комментарий преподавателя: {reviewComment}
        </p>
      )}
    </div>
  );
}
