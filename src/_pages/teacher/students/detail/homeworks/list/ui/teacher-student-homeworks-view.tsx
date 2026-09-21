"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardCheck, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HomeworkList, homeworkQueries, type HomeworkStatus } from "@/entities/homework";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

const statuses: HomeworkStatus[] = ["ASSIGNED", "COMPLETED", "CANCELLED"];

const primaryLinkClassName =
  "inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600";

function pageFrom(value: string | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function TeacherStudentHomeworksView({
  studentId,
}: Readonly<{
  studentId: string;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = pageFrom(searchParams.get("page"));

  const status = statuses.find((value) => value === searchParams.get("status"));

  const studentProgramId = searchParams.get("studentProgramId") || undefined;

  const homeworks = useQuery(
    homeworkQueries.list(studentId, {
      page,
      size: 20,
      sort: "assignedAt,desc",
      ...(status ? { status } : {}),
      ...(studentProgramId ? { studentProgramId } : {}),
    }),
  );

  const programs = useQuery(studentProgramQueries.list(studentId));

  const navigate = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));

    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-[1280px] space-y-4">
      <section className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href={`/teacher/students/${studentId}`}
        >
          <ArrowLeft size={16} />
          Профиль ученика
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ClipboardCheck size={21} />
            </span>

            <div>
              <p className="text-sm font-medium text-blue-600">Учебный процесс</p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Домашние задания</h1>

              <p className="mt-2 text-sm text-slate-500">Назначенные задания и состояние их выполнения.</p>
            </div>
          </div>

          {programs.data && programs.data.length > 0 && (
            <Link className={primaryLinkClassName} href={`/teacher/students/${studentId}/homework/new`}>
              <Plus size={16} className="mr-2" />
              Назначить домашнее задание
            </Link>
          )}
        </div>
      </section>

      <StudentProfileNav active="homework" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_12px_40px_rgba(45,79,135,0.06)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Задания ученика</h2>

              <p className="mt-1 text-sm text-slate-500">Фильтруйте по программе и статусу.</p>
            </div>

            <Filter size={19} className="text-slate-400" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-3">
            <select
              aria-label="Программа"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              value={studentProgramId ?? ""}
              onChange={(event) =>
                navigate({
                  studentProgramId: event.target.value || undefined,
                  page: undefined,
                })
              }
            >
              <option value="">Все программы</option>

              {programs.data?.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>

            <select
              aria-label="Статус"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              value={status ?? ""}
              onChange={(event) =>
                navigate({
                  status: event.target.value || undefined,
                  page: undefined,
                })
              }
            >
              <option value="">Все статусы</option>
              <option value="ASSIGNED">Назначено</option>
              <option value="COMPLETED">Выполнено</option>
              <option value="CANCELLED">Отменено</option>
            </select>
          </div>

          <div className="mt-5">
            {homeworks.isPending && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                Загружаем домашние задания…
              </p>
            )}

            {homeworks.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить домашние задания.</p>

                <Button type="button" variant="secondary" onClick={() => homeworks.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {homeworks.data?.items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                <ClipboardCheck size={28} className="mx-auto text-blue-500" />

                <p className="mt-4 font-semibold text-slate-950">Домашних заданий пока нет</p>

                {programs.data && programs.data.length > 0 ? (
                  <Link className={`${primaryLinkClassName} mt-5`} href={`/teacher/students/${studentId}/homework/new`}>
                    Назначить домашнее задание
                  </Link>
                ) : programs.data?.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm text-slate-500">Сначала назначьте ученику программу обучения</p>

                    <Link
                      className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                      href={`/teacher/students/${studentId}/program`}
                    >
                      Перейти в раздел «Программа»
                    </Link>
                  </>
                ) : null}
              </div>
            )}

            {homeworks.data && homeworks.data.items.length > 0 && (
              <HomeworkList homeworks={homeworks.data.items} studentId={studentId} />
            )}
          </div>

          {homeworks.data && homeworks.data.totalPages > 1 && (
            <nav
              className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5"
              aria-label="Пагинация домашних заданий"
            >
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                disabled={page === 0 || homeworks.isFetching}
                onClick={() =>
                  navigate({
                    page: String(page - 1),
                  })
                }
              >
                Назад
              </button>

              <span className="text-sm text-slate-500">
                Страница {homeworks.data.page + 1} из {homeworks.data.totalPages}
              </span>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                type="button"
                disabled={page + 1 >= homeworks.data.totalPages || homeworks.isFetching}
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
          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <ClipboardCheck size={20} className="text-blue-600" />

            <h2 className="mt-4 font-semibold text-slate-950">Домашняя работа</h2>

            <div className="mt-5 flex items-end justify-between rounded-2xl bg-white/80 p-4">
              <span className="text-sm text-slate-500">Найдено</span>

              <span className="text-2xl font-semibold text-slate-950">{homeworks.data?.totalElements ?? "—"}</span>
            </div>

            <div className="mt-3 flex items-end justify-between rounded-2xl bg-white/80 p-4">
              <span className="text-sm text-slate-500">Программ</span>

              <span className="text-2xl font-semibold text-slate-950">{programs.data?.length ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
