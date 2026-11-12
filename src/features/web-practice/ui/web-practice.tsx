"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CodeTypingTraining } from "@/features/code-typing/ui/code-typing";
import { Button, buttonClassName } from "@/shared/ui/button";
import { Select } from "@/shared/ui/form-controls";
import { createPracticeTask, practiceTechnologies, type PracticeTechnology } from "../model/tasks";
import { ExamWorkspace } from "./exam-workspace";

type Session = { technology: PracticeTechnology; mode: "typing" | "exam"; seed: number; position: number };

export function WebPractice() {
  const [technology, setTechnology] = useState<PracticeTechnology>("all");
  const [mode, setMode] = useState<Session["mode"]>("exam");
  const [session, setSession] = useState<Session | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const task = useMemo(
    () => (session ? createPracticeTask(session.technology, session.seed, session.position) : null),
    [session],
  );
  function next() {
    setSession((current) => (current ? { ...current, position: current.position + 1 } : null));
    setConfirmSkip(false);
  }

  return (
    <main className="page-stack min-w-0">
      <header>
        <p className="text-sm font-medium text-primary">Самостоятельная практика</p>
        <h1 className="page-title mt-1">Практика вёрстки</h1>
        <p className="mt-2 text-foreground-muted">
          Новые варианты страниц по HTML, CSS и JavaScript — столько, сколько нужно для тренировки.
        </p>
      </header>
      {!session || !task ? (
        <section className="surface max-w-3xl space-y-5" aria-label="Настройка практики">
          <div className="space-y-2 text-sm font-medium">
            <label htmlFor="practice-technology" className="block">
              Технология
            </label>
            <Select
              id="practice-technology"
              value={technology}
              onChange={(event) => setTechnology(event.target.value as PracticeTechnology)}
            >
              {Object.entries(practiceTechnologies).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-3 font-semibold">Режим практики</legend>
            {(
              [
                [
                  "exam",
                  "Редактор как на экзамене",
                  "Самостоятельная вёрстка страницы: проводник, вкладки и редактор Monaco, как в VS Code. Условие и образец — рядом, готовый ответ в код не подставляется.",
                ],
                [
                  "typing",
                  "Набор по серому образцу",
                  "Тренируйте синтаксис по шагам. В режиме всех технологий чередуются HTML, CSS и JavaScript. После завершения сразу доступно следующее задание.",
                ],
              ] as const
            ).map(([value, label, description]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-4"
              >
                <input
                  type="radio"
                  name="practice-mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="mt-1 block text-sm leading-6 text-foreground-muted">{description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-foreground-muted">
            Поток собирается из шаблонов: меняются страницы, цвета, размеры и поведение. Типы задач повторяются для
            закрепления. История и незавершённые попытки не сохраняются.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                setSession({ technology, mode, seed: Math.floor(Math.random() * 1000000), position: 0 });
                setConfirmExit(false);
              }}
            >
              Начать поток
            </Button>
            <Link href="/student/code-typing" className={buttonClassName("secondary")}>
              Пять вводных упражнений
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-surface p-3">
            <p className="text-sm font-medium" role="status">
              {practiceTechnologies[session.technology]} · {session.mode === "exam" ? "Редактор" : "Набор"} · Задание{" "}
              {session.position + 1}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setConfirmSkip(true)}>
                Пропустить
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmExit(true)}>
                Изменить практику
              </Button>
            </div>
          </div>
          {(confirmSkip || confirmExit) && (
            <div
              className="flex flex-wrap items-center gap-3 rounded-control border border-warning-border bg-warning-subtle p-3"
              role="group"
              aria-label="Переход из задания"
            >
              <p className="text-sm">Набранный код текущего задания будет потерян.</p>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (confirmExit) {
                    setSession(null);
                    setConfirmExit(false);
                    setConfirmSkip(false);
                  } else next();
                }}
              >
                {confirmExit ? "Вернуться к настройкам" : "Перейти к следующему"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setConfirmExit(false);
                  setConfirmSkip(false);
                }}
              >
                Остаться в задании
              </Button>
            </div>
          )}
          {session.mode === "exam" ? (
            <ExamWorkspace key={task.id} task={task} onNext={next} />
          ) : (
            <CodeTypingTraining
              key={task.id}
              exercise={task.typing}
              onExit={() => setConfirmExit(true)}
              onNext={next}
            />
          )}
        </div>
      )}
    </main>
  );
}
