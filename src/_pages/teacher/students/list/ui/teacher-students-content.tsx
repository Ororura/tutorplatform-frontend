"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
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
    <main className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 py-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Ученики</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Управляйте учениками, отслеживайте состояние аккаунтов и переходите к учебным программам.
          </p>
        </div>

        <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} />
      </header>

      <section className="min-w-0" aria-labelledby="student-list-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="student-list-title" className="text-base font-semibold text-slate-950">
              Список учеников{" "}
              {students.data && (
                <span className="font-normal text-slate-500">
                  {" · "}
                  {students.data.totalElements}
                </span>
              )}
            </h2>
          </div>

          {students.isFetching && !students.isPending && (
            <span className="text-sm text-blue-600" role="status">
              Обновляем…
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 lg:flex-row">
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

              <label className="sr-only sm:not-sr-only" htmlFor="student-page-size">
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
