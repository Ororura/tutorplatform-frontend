"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-sm text-neutral-600 underline underline-offset-4" href="/teacher/students">
            ← Ученики
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Банк заданий</h1>
        </div>
        <CreateTaskDialog />
      </div>
      <div className="flex flex-wrap gap-3">
        <label>
          <span className="sr-only">Предмет</span>
          <select
            aria-label="Предмет"
            className="h-10 rounded-md border border-neutral-300 bg-white px-3"
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
            className="h-10 rounded-md border border-neutral-300 bg-white px-3"
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
            className="h-10 rounded-md border border-neutral-300 bg-white px-3"
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
      {(tasks.isPending || subjects.isPending) && (
        <p className="rounded-lg border p-5 text-neutral-600" aria-busy="true">
          Загружаем задания…
        </p>
      )}
      {(tasks.isError || subjects.isError) && (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert">
          <p>Не удалось загрузить банк заданий.</p>
          <Button
            type="button"
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
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Задания не найдены</p>
          <p className="mt-1 text-sm text-neutral-600">Измените фильтры или создайте новое задание.</p>
        </div>
      )}
      {tasks.data && subjects.data && tasks.data.items.length > 0 && (
        <TaskList tasks={tasks.data.items} subjects={subjects.data} />
      )}
      {tasks.data && tasks.data.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Пагинация заданий">
          <button
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            type="button"
            disabled={page === 0 || tasks.isFetching}
            onClick={() => navigate({ page: String(page - 1) })}
          >
            Назад
          </button>
          <span className="text-sm text-neutral-600">
            Страница {tasks.data.page + 1} из {tasks.data.totalPages}
          </span>
          <button
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            type="button"
            disabled={page + 1 >= tasks.data.totalPages || tasks.isFetching}
            onClick={() => navigate({ page: String(page + 1) })}
          >
            Вперёд
          </button>
        </nav>
      )}
    </main>
  );
}
