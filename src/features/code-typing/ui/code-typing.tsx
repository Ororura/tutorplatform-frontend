"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { WebPreview } from "@/shared/ui/web-preview";
import { webFileNames } from "@/shared/lib/web-exercise";
import {
  attemptStatistics,
  createAttempt,
  pauseAttempt,
  resumeAttempt,
  updateInput,
  type TypingAttempt,
} from "../model/attempt";
import { completedFiles, typingExercises, type TypingExercise } from "../model/exercises";
import { TypingInput } from "./typing-input";

export function CodeTyping() {
  const [exercise, setExercise] = useState<TypingExercise | null>(null);
  const catalogHeading = useRef<HTMLHeadingElement>(null);
  return (
    <main className="page-content page-stack">
      <header>
        <p className="text-sm font-medium text-primary">Самостоятельная практика</p>
        <h1 className="page-title mt-1" tabIndex={-1} ref={catalogHeading}>
          Скорость набора кода
        </h1>
        <p className="mt-2 text-foreground-muted">Набирайте код по шагам и наблюдайте, как оживает интерфейс.</p>
      </header>
      {exercise ? (
        <Training
          key={exercise.id}
          exercise={exercise}
          onExit={() => {
            setExercise(null);
            catalogHeading.current?.focus();
          }}
        />
      ) : (
        <section aria-label="Упражнения" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {typingExercises.map((item) => (
            <article key={item.id} className="surface flex flex-col gap-3">
              <p className="text-sm font-medium text-primary">
                {item.language} · Шагов: {item.steps.length}
              </p>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="flex-1 text-sm leading-6 text-foreground-muted">{item.description}</p>
              <Button type="button" onClick={() => setExercise(item)} aria-label={`Начать: ${item.title}`}>
                Начать упражнение
              </Button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function Training({ exercise, onExit }: Readonly<{ exercise: TypingExercise; onExit: () => void }>) {
  const [attempt, setAttempt] = useState(createAttempt);
  const [now, setNow] = useState(0);
  const [repeat, setRepeat] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const files = useMemo(() => completedFiles(exercise, attempt.completedSteps), [exercise, attempt.completedSteps]);
  const step = exercise.steps[attempt.completedSteps];
  const stats = attemptStatistics(exercise, attempt, now);

  function transition(change: (current: TypingAttempt, time: number) => TypingAttempt) {
    const time = performance.now();
    setNow(time);
    setAttempt((current) => change(current, time));
  }

  useEffect(() => {
    heading.current?.focus();
  }, [repeat]);
  useEffect(() => {
    if (attempt.status !== "running") return;
    const interval = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(interval);
  }, [attempt.status]);
  useEffect(() => {
    function pause() {
      const time = performance.now();
      setNow(time);
      setAttempt((current) => pauseAttempt(current, time));
      if (document.activeElement instanceof HTMLTextAreaElement) document.activeElement.blur();
    }
    function visibility() {
      if (document.hidden) pause();
    }
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (attempt.status === "completed") resultHeading.current?.focus();
  }, [attempt.status]);

  const announcement =
    attempt.status === "completed"
      ? "Упражнение завершено."
      : attempt.status === "paused"
        ? "Пауза. Вернитесь в поле ввода, чтобы продолжить."
        : `Шаг ${attempt.completedSteps + 1} из ${exercise.steps.length}. ${step.hint}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-primary">{exercise.language}</p>
          <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">
            {exercise.title}
          </h2>
        </div>
        <Button type="button" variant="secondary" onClick={onExit}>
          К упражнениям
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Статистика тренировки">
        {[
          ["Скорость", `${stats.speed} зн/мин`],
          ["Точность", `${stats.accuracy}%`],
          ["Активное время", formatTime(stats.time)],
          ["Завершено шагов", `${attempt.completedSteps} / ${exercise.steps.length}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-control border border-border bg-surface p-3">
            <dt className="text-sm text-foreground-muted">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p role="status" className="rounded-control bg-primary-subtle p-3 text-sm text-primary">
        {announcement}
      </p>
      {attempt.status === "completed" && (
        <section className="surface space-y-3" aria-label="Итог упражнения">
          <h2 ref={resultHeading} tabIndex={-1} className="text-xl font-semibold">
            Упражнение завершено!
          </h2>
          <p>
            {stats.speed} зн/мин · Точность {stats.accuracy}% · Время {formatTime(stats.time)} · Ошибок: {stats.errors}
          </p>
          <p className="text-sm text-foreground-muted">
            Завершено шагов: {attempt.completedSteps} из {exercise.steps.length}. Попробуйте готовый результат в
            предпросмотре.
          </p>
          <Button
            type="button"
            onClick={() => {
              setAttempt(createAttempt());
              setNow(0);
              setRepeat((value) => value + 1);
            }}
          >
            Повторить
          </Button>
        </section>
      )}
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
        <section className="surface min-w-0 space-y-4" aria-label="Код упражнения">
          {step ? (
            <TypingInput
              key={repeat}
              files={files}
              step={step}
              value={attempt.value}
              paused={attempt.status === "paused"}
              onChange={(value) => transition((current, time) => updateInput(exercise, current, value, time))}
              onPause={() => transition(pauseAttempt)}
              onResume={() => transition(resumeAttempt)}
            />
          ) : (
            <p className="font-medium text-primary">Все фрагменты набраны.</p>
          )}
          <details>
            <summary className="cursor-pointer text-sm font-medium">Применённые файлы · только чтение</summary>
            {Object.entries(webFileNames).map(([file, name]) => (
              <div key={file} className="mt-3">
                <h3 className="text-sm font-medium">{name}</h3>
                <pre className="mt-2 max-h-64 overflow-auto rounded-control bg-surface-subtle p-3 font-mono text-xs whitespace-pre-wrap wrap-anywhere">
                  {files[file as keyof typeof files] || "// Пока пусто"}
                </pre>
              </div>
            ))}
          </details>
          <p className="text-xs leading-5 text-foreground-muted">
            Скорость учитывает верные символы в набранном коде и активное время. Точность учитывает все вводы, включая
            исправленные ошибки. Готовая основа и автоматические отступы в расчёт не входят.
          </p>
        </section>
        <section className="surface min-w-0 space-y-4" aria-label="Живой результат">
          <div>
            <h2 className="text-lg font-semibold">Живой предпросмотр</h2>
            <p className="mt-1 text-sm text-foreground-muted">Обновляется после точного завершения шага.</p>
          </div>
          {/* Reuse the isolated preview unchanged. A new document prevents duplicate JS handlers. */}
          <WebPreview key={`${repeat}:${attempt.completedSteps}`} files={files} />
        </section>
      </div>
    </div>
  );
}

function formatTime(time: number) {
  const seconds = Math.floor(time / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
