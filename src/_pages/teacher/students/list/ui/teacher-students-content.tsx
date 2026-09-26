"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenText, ChevronRight, ClipboardList, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { type StudentAccountStatus, type StudentListParams, studentQueries } from "@/entities/student";
import { CreateStudentDialog } from "@/features/student/create";

import { StudentListState } from "./student-list-state";

const accountStatuses: StudentAccountStatus[] = ["UNREGISTERED", "INVITED", "REGISTERED"];

const allowedSorts = ["createdAt,desc", "createdAt,asc", "firstName,asc", "lastName,asc"] as const;

const allowedSizes = [10, 20, 50] as const;

function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function TeacherStudentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get("page"));
  const search = searchParams.get("search")?.slice(0, 100) ?? "";

  const rawSize = Number(searchParams.get("size"));
  const size = allowedSizes.find((value) => value === rawSize) ?? 20;

  const rawSort = searchParams.get("sort");
  const sort = allowedSorts.find((value) => value === rawSort) ?? "createdAt,desc";

  const rawAccountStatus = searchParams.get("accountStatus");

  const accountStatus = accountStatuses.find((status) => status === rawAccountStatus);

  const [createOpen, setCreateOpen] = useState(false);

  const params: StudentListParams = {
    page,
    size,
    sort,
    ...(search ? { query: search } : {}),
    ...(accountStatus ? { accountStatus } : {}),
  };

  const students = useQuery(studentQueries.list(params));

  const navigate = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }

      const suffix = next.toString();

      router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const hasActiveFilters = Boolean(search || accountStatus);

  return (
    <main className="space-y-4">
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:flex-row sm:items-center sm:p-7">
        <div>
          <p className="text-sm font-medium text-blue-600">Рабочее пространство</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Ученики</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Управляйте учениками, отслеживайте состояние аккаунтов и переходите к учебным программам.
          </p>
        </div>

        <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Список учеников</h2>

              <p className="mt-1 text-sm text-slate-500">Поиск, фильтрация и быстрый переход к ученику.</p>
            </div>

            {students.isFetching && !students.isPending && (
              <span className="text-sm text-blue-600" role="status">
                Обновляем…
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 lg:flex-row">
            <StudentSearch key={search} initialSearch={search} navigate={navigate} />

            <label>
              <span className="sr-only">Статус аккаунта</span>

              <select
                id="account-status-filter"
                aria-label="Статус аккаунта"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 lg:w-auto"
                value={accountStatus ?? ""}
                onChange={(event) =>
                  navigate({
                    accountStatus: event.target.value || undefined,
                    page: undefined,
                  })
                }
              >
                <option value="">Все аккаунты</option>
                <option value="UNREGISTERED">Без аккаунта</option>
                <option value="INVITED">Приглашён</option>
                <option value="REGISTERED">Зарегистрирован</option>
              </select>
            </label>

            <label>
              <span className="sr-only">Сортировка</span>

              <select
                id="student-sort"
                aria-label="Сортировка"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 lg:w-auto"
                value={sort}
                onChange={(event) =>
                  navigate({
                    sort: event.target.value,
                    page: undefined,
                  })
                }
              >
                <option value="createdAt,desc">Сначала новые</option>
                <option value="createdAt,asc">Сначала старые</option>
                <option value="firstName,asc">По имени</option>
                <option value="lastName,asc">По фамилии</option>
              </select>
            </label>
          </div>

          <div className="mt-5">
            <StudentListState
              isPending={students.isPending}
              isError={students.isError}
              data={students.data}
              onRetry={() => students.refetch()}
              hasActiveFilters={hasActiveFilters}
              onAddStudent={() => setCreateOpen(true)}
            />
          </div>

          {students.data && students.data.totalPages > 1 && (
            <nav
              className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"
              aria-label="Пагинация учеников"
            >
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                disabled={page === 0 || students.isFetching}
                onClick={() =>
                  navigate({
                    page: String(page - 1),
                  })
                }
              >
                Назад
              </button>

              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>
                  Страница {students.data.page + 1} из {students.data.totalPages}
                </span>

                <label className="hidden sm:inline" htmlFor="student-page-size">
                  На странице
                </label>

                <select
                  id="student-page-size"
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2"
                  value={size}
                  onChange={(event) =>
                    navigate({
                      size: event.target.value,
                      page: undefined,
                    })
                  }
                >
                  {allowedSizes.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                disabled={page + 1 >= students.data.totalPages || students.isFetching}
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
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UsersRound size={19} />
              </span>

              <div>
                <h2 className="font-semibold text-slate-950">Обзор</h2>

                <p className="text-xs text-slate-500">Текущая выборка</p>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">{hasActiveFilters ? "Найдено" : "Всего учеников"}</dt>

                <dd className="text-lg font-semibold text-slate-950">{students.data?.totalElements ?? "—"}</dd>
              </div>

              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-slate-500">На странице</dt>

                <dd className="font-semibold text-slate-900">{students.data?.items.length ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <h2 className="font-semibold text-slate-950">Быстрый переход</h2>

            <div className="mt-4 space-y-2">
              <Link
                href="/teacher/programs"
                className="group flex items-center gap-3 rounded-2xl bg-white/80 p-3.5 transition hover:bg-white"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <BookOpenText size={17} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">Программы</span>
                  <span className="block text-xs text-slate-500">Шаблоны обучения</span>
                </span>

                <ChevronRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/teacher/tasks"
                className="group flex items-center gap-3 rounded-2xl bg-white/80 p-3.5 transition hover:bg-white"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <ClipboardList size={17} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">Банк заданий</span>
                  <span className="block text-xs text-slate-500">Практика учеников</span>
                </span>

                <ChevronRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function StudentSearch({
  initialSearch,
  navigate,
}: Readonly<{
  initialSearch: string;
  navigate: (updates: Record<string, string | undefined>) => void;
}>) {
  const [value, setValue] = useState(initialSearch);

  useEffect(() => {
    const normalized = value.trim().slice(0, 100);

    if (normalized === initialSearch) return;

    const timer = window.setTimeout(() => {
      navigate({
        search: normalized || undefined,
        page: undefined,
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [initialSearch, navigate, value]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = value.trim().slice(0, 100);

    navigate({
      search: normalized || undefined,
      page: undefined,
    });
  };

  return (
    <form className="flex min-w-0 flex-1 gap-2" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="student-search">
        Поиск ученика
      </label>

      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id="student-search"
          name="search"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          maxLength={100}
          placeholder="Имя или фамилия"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>

      <button
        className="rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        type="submit"
      >
        Найти
      </button>
    </form>
  );
}
