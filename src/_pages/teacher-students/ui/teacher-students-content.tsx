"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";

import { studentQueries, type StudentAccountStatus, type StudentListParams } from "@/entities/student";
import { CreateStudentForm } from "@/features/create-student";

import { StudentListState } from "./student-list-state";

const accountStatuses: StudentAccountStatus[] = ["UNREGISTERED", "INVITED", "REGISTERED"];

function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function TeacherStudentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const query = searchParams.get("query")?.slice(0, 100) ?? "";
  const rawAccountStatus = searchParams.get("accountStatus");
  const accountStatus = accountStatuses.find((status) => status === rawAccountStatus);
  const params: StudentListParams = {
    page,
    size: 20,
    sort: "createdAt,desc",
    ...(query ? { query } : {}),
    ...(accountStatus ? { accountStatus } : {}),
  };
  const students = useQuery(studentQueries.list(params));

  const navigate = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = String(new FormData(event.currentTarget).get("query") ?? "");
    navigate({ query: search.trim().slice(0, 100) || undefined, page: undefined });
  };

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="create-student-heading" className="space-y-3">
        <h2 id="create-student-heading" className="text-xl font-semibold">Добавить ученика</h2>
        <CreateStudentForm />
      </section>

      <section aria-labelledby="student-list-heading" className="space-y-4">
        <h2 id="student-list-heading" className="text-xl font-semibold">Список учеников</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form className="flex flex-1 gap-2" onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor="student-search">Поиск ученика</label>
            <input
              id="student-search"
              key={query}
              name="query"
              className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3"
              maxLength={100}
              placeholder="Имя или фамилия"
              defaultValue={query}
            />
            <button className="rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium" type="submit">Найти</button>
          </form>
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
        </div>

        <StudentListState
          isPending={students.isPending}
          isError={students.isError}
          data={students.data}
          onRetry={() => students.refetch()}
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
            <span className="text-sm text-neutral-600">
              Страница {students.data.page + 1} из {students.data.totalPages}
            </span>
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
