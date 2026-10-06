"use client";
import { Select } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type TaskDifficulty, TaskList, taskQueries, type TaskStatus } from "@/entities/task";
import { CreateTaskDialog } from "@/features/task/create";
import { Button } from "@/shared/ui/button";

const statuses: TaskStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

const difficulties: TaskDifficulty[] = ["EASY", "MEDIUM", "HARD"];

function pageFrom(value: string | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function TeacherTasksView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = pageFrom(searchParams.get("page"));

  const subjectId = searchParams.get("subjectId") || undefined;

  const status = statuses.find((value) => value === searchParams.get("status"));

  const difficulty = difficulties.find((value) => value === searchParams.get("difficulty"));

  const params = {
    page,
    size: 20,
    sort: "updatedAt,desc",
    ...(subjectId ? { subjectId } : {}),
    ...(status ? { status } : {}),
    ...(difficulty ? { difficulty } : {}),
  };

  const tasks = useQuery(taskQueries.list(params));
  const subjects = useQuery(taskQueries.subjects());

  const navigate = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));

    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <main className="page-stack">
      <header className="flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-title">Банк заданий</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Создавайте практику и используйте задания в домашних работах учеников.
          </p>
        </div>

        <CreateTaskDialog />
      </header>

      <section className="min-w-0" aria-labelledby="task-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="task-list-title" className="section-title">
              Задания
            </h2>
            <p className="mt-1 text-sm text-(--text-secondary)">Фильтруйте по предмету, статусу и сложности.</p>
          </div>
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Состояние банка заданий">
          <div className="flex items-center gap-2">
            <dt className="text-(--text-secondary)">Найдено заданий</dt>
            <dd className="font-medium tabular-nums text-foreground">{tasks.data?.totalElements ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-(--text-secondary)">Предметов</dt>
            <dd className="font-medium tabular-nums text-foreground">{subjects.data?.length ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-col gap-3 rounded-surface border border-(--border) bg-(--surface-muted) p-3 sm:flex-row sm:flex-wrap">
          <label className="min-w-0 sm:max-w-full">
            <span className="sr-only">Предмет</span>

            <Select
              aria-label="Предмет"
              className="min-w-0"
              value={subjectId ?? ""}
              onChange={(event) =>
                navigate({
                  subjectId: event.target.value || undefined,
                  page: undefined,
                })
              }
            >
              <option value="">Все предметы</option>

              {subjects.data?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="min-w-0 sm:max-w-full">
            <span className="sr-only">Статус</span>

            <Select
              aria-label="Статус"
              className="min-w-0"
              value={status ?? ""}
              onChange={(event) =>
                navigate({
                  status: event.target.value || undefined,
                  page: undefined,
                })
              }
            >
              <option value="">Все статусы</option>
              <option value="DRAFT">Черновики</option>
              <option value="ACTIVE">Активные</option>
              <option value="ARCHIVED">Архив</option>
            </Select>
          </label>

          <label className="min-w-0 sm:max-w-full">
            <span className="sr-only">Сложность</span>

            <Select
              aria-label="Сложность"
              className="min-w-0"
              value={difficulty ?? ""}
              onChange={(event) =>
                navigate({
                  difficulty: event.target.value || undefined,
                  page: undefined,
                })
              }
            >
              <option value="">Любая сложность</option>
              <option value="EASY">Лёгкая</option>
              <option value="MEDIUM">Средняя</option>
              <option value="HARD">Сложная</option>
            </Select>
          </label>
        </div>

        <div className="mt-5">
          {(tasks.isPending || subjects.isPending) && (
            <div className="rounded-surface bg-surface-subtle p-6 text-sm text-(--text-secondary)" aria-busy="true">
              Загружаем задания…
            </div>
          )}

          {(tasks.isError || subjects.isError) && (
            <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
              <p className="text-sm text-danger">Не удалось загрузить банк заданий.</p>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void tasks.refetch();
                  void subjects.refetch();
                }}
              >
                Повторить
              </Button>
            </div>
          )}

          {tasks.data?.items.length === 0 && (
            <div className="rounded-surface bg-(--surface-muted) px-4 py-6 text-center">
              <p className="font-semibold text-foreground">Задания не найдены</p>

              <p className="mt-2 text-sm text-(--text-secondary)">Измените фильтры или создайте новое задание.</p>
            </div>
          )}

          {tasks.data && subjects.data && tasks.data.items.length > 0 && (
            <TaskList tasks={tasks.data.items} subjects={subjects.data} />
          )}
        </div>

        {tasks.data && tasks.data.totalPages > 1 && (
          <nav
            className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
            aria-label="Пагинация заданий"
          >
            <Button
              variant="secondary"
              type="button"
              disabled={page === 0 || tasks.isFetching}
              onClick={() =>
                navigate({
                  page: String(page - 1),
                })
              }
            >
              Назад
            </Button>

            <span className="text-sm text-(--text-secondary)">
              Страница {tasks.data.page + 1} из {tasks.data.totalPages}
            </span>

            <Button
              variant="secondary"
              type="button"
              disabled={page + 1 >= tasks.data.totalPages || tasks.isFetching}
              onClick={() =>
                navigate({
                  page: String(page + 1),
                })
              }
            >
              Вперёд
            </Button>
          </nav>
        )}
      </section>

      <p className="text-sm text-(--text-secondary)">Созданные задания можно добавлять в домашние работы учеников.</p>
    </main>
  );
}
