"use client";

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
    <main className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Банк заданий</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Создавайте практику и используйте задания в домашних работах учеников.
          </p>
        </div>

        <CreateTaskDialog />
      </header>

      <section className="min-w-0" aria-labelledby="task-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="task-list-title" className="text-base font-semibold text-slate-950">
              Задания
            </h2>
            <p className="mt-1 text-sm text-(--text-secondary)">Фильтруйте по предмету, статусу и сложности.</p>
          </div>
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Состояние банка заданий">
          <div className="flex items-center gap-2">
            <dt className="text-(--text-secondary)">Найдено заданий</dt>
            <dd className="font-medium tabular-nums text-slate-900">{tasks.data?.totalElements ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-(--text-secondary)">Предметов</dt>
            <dd className="font-medium tabular-nums text-slate-900">{subjects.data?.length ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-(--border) bg-(--surface-muted) p-3 sm:flex-row sm:flex-wrap">
          <label className="min-w-0 sm:max-w-full">
            <span className="sr-only">Предмет</span>

            <select
              aria-label="Предмет"
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-4 focus:ring-blue-100"
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
            </select>
          </label>

          <label className="min-w-0 sm:max-w-full">
            <span className="sr-only">Статус</span>

            <select
              aria-label="Статус"
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-4 focus:ring-blue-100"
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
            </select>
          </label>

          <label className="min-w-0 sm:max-w-full">
            <span className="sr-only">Сложность</span>

            <select
              aria-label="Сложность"
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-4 focus:ring-blue-100"
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
            </select>
          </label>
        </div>

        <div className="mt-5">
          {(tasks.isPending || subjects.isPending) && (
            <div className="rounded-2xl bg-slate-50 p-6 text-sm text-(--text-secondary)" aria-busy="true">
              Загружаем задания…
            </div>
          )}

          {(tasks.isError || subjects.isError) && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
              <p className="text-sm text-red-700">Не удалось загрузить банк заданий.</p>

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
            <div className="rounded-xl bg-(--surface-muted) px-4 py-6 text-center">
              <p className="font-semibold text-slate-900">Задания не найдены</p>

              <p className="mt-2 text-sm text-(--text-secondary)">Измените фильтры или создайте новое задание.</p>
            </div>
          )}

          {tasks.data && subjects.data && tasks.data.items.length > 0 && (
            <TaskList tasks={tasks.data.items} subjects={subjects.data} />
          )}
        </div>

        {tasks.data && tasks.data.totalPages > 1 && (
          <nav
            className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"
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
