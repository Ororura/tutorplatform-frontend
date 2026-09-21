"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { StudentHomeworkItem } from "@/entities/homework";
import type { StudentTopicTask } from "@/entities/task";
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

type HomeworkSolutionProps = Readonly<{
  homeworkId: string;
  homeworkStatus: HomeworkStatus;
  item: StudentHomeworkItem;
  practice?: never;
}>;

type PracticeSolutionProps = Readonly<{
  homeworkId?: never;
  homeworkStatus?: never;
  item?: never;
  practice: {
    studentProgramId: string;
    topicId: string;
    task: StudentTopicTask;
  };
}>;

type SolutionProps = HomeworkSolutionProps | PracticeSolutionProps;

export function StudentTaskSolution(props: SolutionProps) {
  const practice = props.practice;
  const homeworkItem = props.item;
  const taskId = practice?.task.id ?? homeworkItem?.taskId ?? "";
  const homeworkItemId = homeworkItem?.id;
  const submissions = useQuery(studentSubmissionQueries.list(taskId, homeworkItemId));
  const standaloneSubmissions =
    submissions.data?.items.filter(
      (submission) => submission.homeworkItemId === null || submission.homeworkItemId === undefined,
    ) ?? [];
  const visibleSubmissions = practice ? standaloneSubmissions : (submissions.data?.items ?? []);

  if (practice) {
    const { task } = practice;
    const item: StudentHomeworkItem = {
      id: task.id,
      taskId: task.id,
      position: task.position,
      required: task.required,
      passed: standaloneSubmissions.some((submission) => submission.status === "PASSED"),
      task: {
        id: task.id,
        title: task.title,
        descriptionMarkdown: task.descriptionMarkdown,
        taskType: task.taskType,
        difficulty: task.difficulty,
        codeExecution: task.programmingConfig,
      },
    };

    return (
      <TaskSolutionContent
        item={item}
        practice={practice}
        submissions={visibleSubmissions}
        submissionsError={submissions.isError}
      />
    );
  }

  return (
    <TaskSolutionContent
      homeworkId={props.homeworkId}
      homeworkStatus={props.homeworkStatus}
      item={props.item}
      submissions={visibleSubmissions}
      submissionsError={submissions.isError}
    />
  );
}

function TaskSolutionContent({
  homeworkId,
  homeworkStatus,
  item,
  practice,
  submissions,
  submissionsError,
}: Readonly<{
  homeworkId?: string;
  homeworkStatus?: HomeworkStatus;
  item: StudentHomeworkItem;
  practice?: PracticeSolutionProps["practice"];
  submissions: StudentSubmission[];
  submissionsError: boolean;
}>) {
  const readOnly = homeworkStatus !== undefined && homeworkStatus !== "ASSIGNED";

  return (
    <section
      className="space-y-6 rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
      aria-labelledby={`task-${item.id}-heading`}
    >
      <TaskHeader item={item} />

      {readOnly && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {homeworkStatus === "CANCELLED"
            ? "Домашнее задание отменено. Новые решения недоступны."
            : "Домашнее задание завершено. Новые решения недоступны."}
        </p>
      )}

      {item.task.taskType === "TEXT" && homeworkId && (
        <TextSolution disabled={readOnly} homeworkId={homeworkId} item={item} />
      )}

      {item.task.taskType === "TEXT" && practice && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Самостоятельная отправка текстовых решений пока недоступна.
        </p>
      )}

      {item.task.taskType === "CODE" && (
        <CodeSolution disabled={readOnly} homeworkId={homeworkId} item={item} practice={practice} />
      )}

      {item.task.taskType !== "TEXT" && item.task.taskType !== "CODE" && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Этот тип задания пока не поддерживается.</p>
      )}

      {submissionsError && (
        <p className="text-sm text-red-700" role="alert">
          Не удалось загрузить историю попыток.
        </p>
      )}

      <SubmissionHistory submissions={submissions} />
    </section>
  );
}

function TaskHeader({ item }: Readonly<{ item: StudentHomeworkItem }>) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
          {taskTypePresentation[item.task.taskType] ?? item.task.taskType}
        </span>

        <span>{item.required ? "Обязательное" : "Дополнительное"}</span>

        <span>{item.passed ? "Выполнено" : "Не выполнено"}</span>
      </div>

      <h2 className="text-xl font-semibold text-slate-950" id={`task-${item.id}-heading`}>
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
          className="min-h-40 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
  practice,
}: Readonly<{
  homeworkId?: string;
  item: StudentHomeworkItem;
  disabled: boolean;
  practice?: PracticeSolutionProps["practice"];
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
      ...(practice
        ? { studentProgramId: practice.studentProgramId, topicId: practice.topicId }
        : { homeworkItemId: item.id }),
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
      ...(practice
        ? { studentProgramId: practice.studentProgramId, topicId: practice.topicId }
        : { homeworkItemId: item.id }),
      sourceCode,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <span>Язык: {languagePresentation[config.language] ?? config.language}</span>

        {config.timeLimitMs !== undefined && <span>Лимит времени: {config.timeLimitMs} мс</span>}

        {config.memoryLimitMb !== undefined && <span>Память: {config.memoryLimitMb} МБ</span>}
      </div>

      {!config.executionEnabled && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Запуск и отправка кода сейчас недоступны.</p>
      )}

      <details className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm" open>
        <summary className="cursor-pointer font-medium text-slate-700">Как выполнить задание</summary>
        <div className="mt-3 space-y-3 text-slate-600">
          <p>
            Напишите программу на Python, которая решает задачу. Для чтения входных данных используйте input(), для
            вывода результата — print().
          </p>
          <p>
            Преподаватель мог заранее подготовить для вас часть решения. Если в редакторе уже есть код, внимательно
            изучите его и дополните или измените согласно условию задания. Необязательно писать программу с нуля
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
            <code>{"a, b = map(int, input().split())\nprint(a + b)"}</code>
          </pre>
          <p className="text-xs text-slate-500">Программа считывает два числа из одной строки и выводит их сумму</p>
          <ul className="space-y-1 text-xs">
            <li>«Запустить» — проверить код и посмотреть результат без отправки окончательного решения.</li>
            <li>«Отправить решение» — сохранить ответ и проверить его по тестам задания.</li>
          </ul>
          <p className="text-xs text-slate-500">
            Входные данные для проверки подаются автоматически. Вводить их вручную после запуска не нужно
          </p>
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <h3 className="font-medium text-slate-700">Когда решение считается верным?</h3>
            <p>
              Программа считается верной, когда успешно проходит все тесты задания. Система автоматически передаёт вашей
              программе входные данные и сравнивает полученный результат с ожидаемым ответом.
            </p>
            <p>
              Для вывода результата используйте print(). Именно то, что программа выводит в консоль, проверяется
              системой.
            </p>
            <p>
              Выводите только то, что требуется в условии. Не добавляйте пояснения вроде &quot;Ответ:&quot;,
              &quot;Результат:&quot; или &quot;Введите число:&quot;, если задание этого не требует
            </p>
            <div className="space-y-2">
              <p>Условие: «Прочитайте два числа и выведите их сумму».</p>
              <div>
                <p className="text-xs font-medium text-green-700">Правильно:</p>
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
                  <code>{"a, b = map(int, input().split())\nprint(a + b)"}</code>
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-red-700">Неправильно:</p>
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
                  <code>{'a, b = map(int, input().split())\nprint("Сумма чисел:", a + b)'}</code>
                </pre>
              </div>
              <p className="text-xs text-slate-500">
                Если ожидаемый ответ — 5, программа должна вывести 5, а не &quot;Сумма чисел: 5&quot;.
              </p>
            </div>
            <ul className="space-y-1 text-xs">
              <li>input() получает входные данные, которые система подаёт автоматически.</li>
              <li>print() выводит результат, который система сравнивает с ожидаемым.</li>
              <li>
                Программа может работать без ошибок, но не пройти проверку из-за неправильного ответа или лишнего текста
                в выводе.
              </li>
              <li>Успешное прохождение одного примера не гарантирует прохождение всех тестов.</li>
            </ul>
          </div>
        </div>
      </details>

      <label className="block space-y-2" htmlFor={`source-${item.id}`}>
        <span className="font-medium">Код решения</span>

        <textarea
          className="min-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm text-slate-100 whitespace-pre outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
        <Button variant="secondary" disabled={actionsDisabled} onClick={handleRun} type="button">
          {run.isPending ? "Запускаем…" : "Запустить"}
        </Button>

        <Button disabled={actionsDisabled} onClick={handleSubmit} type="button">
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

function RunExecutionStatus({
  status,
}: Readonly<{
  status: keyof typeof executionStatusPresentation;
}>) {
  switch (status) {
    case "PASSED":
      return <p className="font-medium text-green-700">Все тесты пройдены</p>;

    case "FAILED":
      return <p className="font-medium text-red-700">Есть непройденные тесты</p>;

    case "TIMEOUT":
      return <p className="font-medium text-red-700">Превышен лимит времени</p>;

    case "RUNTIME_ERROR":
      return <p className="font-medium text-red-700">Программа завершилась с ошибкой</p>;

    case "SYSTEM_ERROR":
      return <p className="font-medium text-red-700">Не удалось выполнить код. Попробуйте ещё раз.</p>;

    default:
      return <p className="font-medium">{executionStatusPresentation[status]}</p>;
  }
}

function RunResult({
  result,
}: Readonly<{
  result: ReturnType<typeof useRunStudentCodeMutation>["data"];
}>) {
  if (!result) return null;

  return (
    <section
      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
      aria-label="Результат запуска"
      aria-live="polite"
    >
      <RunExecutionStatus status={result.status} />

      {result.passedTests !== undefined && result.totalTests !== undefined && (
        <p className="text-sm">
          Тесты:{" "}
          <strong>
            {result.passedTests} из {result.totalTests}
          </strong>
        </p>
      )}

      {result.executionTimeMs !== undefined && (
        <p className="text-sm text-slate-500">Время выполнения: {result.executionTimeMs} мс</p>
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
      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
      aria-label="Результат отправки"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{submissionStatusPresentation[submission.status] ?? submission.status}</p>

        <span className="text-sm text-slate-400">Попытка {submission.attemptNo}</span>
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

          <p className="text-sm text-slate-500">Время выполнения: {execution.executionTimeMs} мс</p>

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
    <section className="border-t border-slate-100 pt-4" aria-label="История попыток">
      <h3 className="font-medium">Попытки</h3>

      <ul className="mt-3 space-y-2 text-sm text-slate-600">
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
