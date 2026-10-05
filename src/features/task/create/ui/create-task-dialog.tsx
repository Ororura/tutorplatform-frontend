"use client";
import { Input, Select, Textarea } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ComponentProps, useEffect, useRef, useState } from "react";

import { type TaskDifficulty, taskQueries, type TaskType } from "@/entities/task";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateTaskMutation } from "../api/create-task";

type TestCaseDraft = { inputText: string; expectedOutput: string; hidden: boolean };

type Props = {
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function CreateTaskDialog({ triggerVariant = "primary" }: Readonly<Props>) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const subjects = useQuery(taskQueries.subjects());
  const mutation = useCreateTaskMutation();
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("TEXT");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("EASY");
  const [starterCode, setStarterCode] = useState("");
  const [tests, setTests] = useState<TestCaseDraft[]>([{ inputText: "", expectedOutput: "", hidden: false }]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!subjectId || !title.trim() || !description.trim()) {
      setError("Заполните предмет, название и описание.");
      return;
    }
    if (taskType === "CODE" && tests.some((item) => !item.expectedOutput)) {
      setError("Для каждого теста укажите ожидаемый результат.");
      return;
    }
    setError("");
    try {
      const task = await mutation.mutateAsync({
        subjectId,
        title: title.trim(),
        descriptionMarkdown: description.trim(),
        difficulty,
        taskType,
        ...(taskType === "CODE"
          ? {
              programmingConfig: {
                language: "PYTHON",
                starterCode: starterCode || undefined,
                executionEnabled: true,
                timeLimitMs: 5000,
                memoryLimitMb: 128,
              },
              testCases: tests.map((item, position) => ({
                ...item,
                inputText: item.inputText || undefined,
                comparisonMode: "NORMALIZED",
                position,
              })),
            }
          : {}),
      });
      setOpen(false);
      router.push(`/teacher/tasks/${task.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 400
          ? "Проверьте данные задания."
          : "Не удалось создать задание.",
      );
    }
  };

  return (
    <>
      <Button type="button" variant={triggerVariant} onClick={() => setOpen(true)}>
        Создать задание
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-task-title"
        className="dialog-surface w-[min(46rem,calc(100%-2rem))] overflow-auto"
        onClose={() => setOpen(false)}
      >
        <form className="space-y-5 p-6" onSubmit={submit} noValidate>
          <div className="flex justify-between gap-4">
            <div>
              <h2 id="create-task-title" className="section-title">
                Создать задание
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">Новое задание создаётся как черновик.</p>
            </div>
            <button type="button" className="text-sm underline" onClick={() => setOpen(false)}>
              Закрыть
            </button>
          </div>
          {subjects.isPending && <p aria-busy="true">Загружаем предметы…</p>}
          {subjects.isError && (
            <p role="alert" className="text-danger">
              Не удалось загрузить предметы.
            </p>
          )}
          <label className="block space-y-2">
            <span className="field-label">Предмет</span>
            <Select
              aria-label="Предмет"

              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="">Выберите предмет</option>
              {subjects.data
                ?.filter((item) => item.status === "ACTIVE")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </label>
          <label className="block space-y-2">
            <span className="field-label">Название</span>
            <Input maxLength={220} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="field-label">Описание Markdown</span>
            <Textarea
              className="min-h-32"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="field-label">Тип</span>
              <Select
                aria-label="Тип"

                value={taskType}
                onChange={(event) => setTaskType(event.target.value as TaskType)}
              >
                <option value="TEXT">Текстовый ответ</option>
                <option value="CODE">Код</option>
              </Select>
            </label>
            <label className="space-y-2">
              <span className="field-label">Сложность</span>
              <Select
                aria-label="Сложность"

                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)}
              >
                <option value="EASY">Лёгкая</option>
                <option value="MEDIUM">Средняя</option>
                <option value="HARD">Сложная</option>
              </Select>
            </label>
          </div>
          {taskType === "CODE" && (
            <fieldset className="space-y-4 rounded-inset border border-border p-4">
              <legend className="px-1 font-medium">Конфигурация Python</legend>
              <label className="block space-y-2">
                <span className="text-sm">Стартовый код</span>
                <Textarea
                  className="min-h-28 font-mono"
                  value={starterCode}
                  onChange={(event) => setStarterCode(event.target.value)}
                />
              </label>
              {tests.map((item, index) => (
                <div className="grid gap-3 rounded-control bg-surface-subtle p-3 sm:grid-cols-2" key={index}>
                  <label className="text-sm">
                    Ввод
                    <Textarea
                      aria-label={`Ввод теста ${index + 1}`}
                      className="mt-1 min-h-20 rounded font-mono"
                      value={item.inputText}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((value, position) =>
                            position === index
                              ? {
                                  ...value,
                                  inputText: event.target.value,
                                }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="text-sm">
                    Ожидаемый вывод
                    <Textarea
                      aria-label={`Ожидаемый вывод теста ${index + 1}`}
                      className="mt-1 min-h-20 rounded font-mono"
                      value={item.expectedOutput}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((value, position) =>
                            position === index
                              ? {
                                  ...value,
                                  expectedOutput: event.target.value,
                                }
                              : value,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Input
                      type="checkbox"
                      checked={item.hidden}
                      onChange={(event) =>
                        setTests((current) =>
                          current.map((value, position) =>
                            position === index
                              ? {
                                  ...value,
                                  hidden: event.target.checked,
                                }
                              : value,
                          ),
                        )
                      }
                    />
                    Скрытый тест
                  </label>
                  {tests.length > 1 && (
                    <button
                      className="justify-self-end text-sm underline"
                      type="button"
                      onClick={() => setTests((current) => current.filter((_, position) => position !== index))}
                    >
                      Удалить тест
                    </button>
                  )}
                </div>
              ))}
              <button
                className="text-sm font-medium underline"
                type="button"
                onClick={() =>
                  setTests((current) => [
                    ...current,
                    {
                      inputText: "",
                      expectedOutput: "",
                      hidden: false,
                    },
                  ])
                }
              >
                Добавить тест
              </button>
            </fieldset>
          )}
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending || subjects.isError}>
            {mutation.isPending ? "Создаём…" : "Создать"}
          </Button>
        </form>
      </dialog>
    </>
  );
}
