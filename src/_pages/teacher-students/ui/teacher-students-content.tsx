"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { studentQueries, type StudentAccountStatus, type StudentListParams } from "@/entities/student";
import { CreateStudentDialog } from "@/features/create-student";

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

  const navigate = useCallback((updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="mt-8 space-y-8">
      <div className="flex justify-end">
        <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
      <section aria-labelledby="student-list-heading" className="space-y-4">
        <h2 id="student-list-heading" className="text-xl font-semibold">Список учеников</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <StudentSearch key={search} initialSearch={search} navigate={navigate} />
          <div>
            <label className="sr-only" htmlFor="account-status-filter">Статус аккаунта</label>
            <select
              id="account-status-filter"
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 sm:w-auto"
              value={accountStatus ?? ""}
              onChange={(event) => navigate({ accountStatus: event.target.value || undefined, page: undefined })}
            >
              <option value="">Все статусы аккаунта</option>
              <option value="UNREGISTERED">Без аккаунта</option>
              <option value="INVITED">Приглашён</option>
              <option value="REGISTERED">Зарегистрирован</option>
            </select>
          </div>
          <div>
            <label className="sr-only" htmlFor="student-sort">Сортировка</label>
            <select
              id="student-sort"
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 sm:w-auto"
              value={sort}
              onChange={(event) => navigate({ sort: event.target.value, page: undefined })}
            >
              <option value="createdAt,desc">Сначала новые</option>
              <option value="createdAt,asc">Сначала старые</option>
              <option value="firstName,asc">По имени</option>
              <option value="lastName,asc">По фамилии</option>
            </select>
          </div>
        </div>

        {students.isFetching && !students.isPending && <p className="text-sm text-neutral-500" role="status">Обновляем список…</p>}

        <StudentListState
          isPending={students.isPending}
          isError={students.isError}
          data={students.data}
          onRetry={() => students.refetch()}
          hasActiveFilters={Boolean(search || accountStatus)}
          onAddStudent={() => setCreateOpen(true)}
        />

        {students.data && students.data.totalPages > 1 && (
          <nav className="flex items-center justify-between" aria-label="Пагинация учеников">
            <button
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
              type="button"
              disabled={page === 0 || students.isFetching}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              Назад
            </button>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span>Страница {students.data.page + 1} из {students.data.totalPages}</span>
              <label htmlFor="student-page-size">На странице</label>
              <select
                id="student-page-size"
                className="h-9 rounded-md border border-neutral-300 bg-white px-2"
                value={size}
                onChange={(event) => navigate({ size: event.target.value, page: undefined })}
              >
                {allowedSizes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <button
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
              type="button"
              disabled={page + 1 >= students.data.totalPages || students.isFetching}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              Вперёд
            </button>
          </nav>
        )}
      </section>
    </div>
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
      navigate({ search: normalized || undefined, page: undefined });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [initialSearch, navigate, value]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = value.trim().slice(0, 100);
    navigate({ search: normalized || undefined, page: undefined });
  };

  return (
    <form className="flex flex-1 gap-2" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="student-search">Поиск ученика</label>
      <input
        id="student-search"
        name="search"
        className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3"
        maxLength={100}
        placeholder="Имя или фамилия"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium" type="submit">Найти</button>
    </form>
  );
}
