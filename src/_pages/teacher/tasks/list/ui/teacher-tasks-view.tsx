"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenText, ClipboardList, Filter } from "lucide-react";
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
    <main className="space-y-4">
      <section className="flex flex-col justify-between gap-6 rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-sm font-medium text-blue-600">Учебные материалы</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Банк заданий</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Создавайте практику и используйте задания в домашних работах учеников.
          </p>
        </div>

        <CreateTaskDialog />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Задания</h2>
              <p className="mt-1 text-sm text-slate-500">Фильтруйте по предмету, статусу и сложности.</p>
            </div>

            <Filter size={19} className="text-slate-400" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-3">
            <label>
              <span className="sr-only">Предмет</span>

              <select
                aria-label="Предмет"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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

            <label>
              <span className="sr-only">Статус</span>

              <select
                aria-label="Статус"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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

            <label>
              <span className="sr-only">Сложность</span>

              <select
                aria-label="Сложность"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
              <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500" aria-busy="true">
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                <p className="font-semibold text-slate-900">Задания не найдены</p>

                <p className="mt-2 text-sm text-slate-500">Измените фильтры или создайте новое задание.</p>
              </div>
            )}

            {tasks.data && subjects.data && tasks.data.items.length > 0 && (
              <TaskList tasks={tasks.data.items} subjects={subjects.data} />
            )}
          </div>

          {tasks.data && tasks.data.totalPages > 1 && (
            <nav
              className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5"
              aria-label="Пагинация заданий"
            >
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
                type="button"
                disabled={page === 0 || tasks.isFetching}
                onClick={() =>
                  navigate({
                    page: String(page - 1),
                  })
                }
              >
                Назад
              </button>

              <span className="text-sm text-slate-500">
                Страница {tasks.data.page + 1} из {tasks.data.totalPages}
              </span>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
                type="button"
                disabled={page + 1 >= tasks.data.totalPages || tasks.isFetching}
                onClick={() =>
                  navigate({
                    page: String(page + 1),
                  })
                }
              >
                Вперёд
              </button>
            </nav>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)]">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ClipboardList size={19} />
              </span>

              <div>
                <h2 className="font-semibold text-slate-950">Банк заданий</h2>
                <p className="text-xs text-slate-500">Текущая выборка</p>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">Найдено заданий</dt>

                <dd className="text-lg font-semibold text-slate-950">{tasks.data?.totalElements ?? "—"}</dd>
              </div>

              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">Предметов</dt>

                <dd className="font-semibold text-slate-900">{subjects.data?.length ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-blue-600">
              <BookOpenText size={19} />
            </span>

            <h2 className="mt-4 font-semibold text-slate-950">Как использовать</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Созданные задания можно добавлять в домашние работы учеников.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
