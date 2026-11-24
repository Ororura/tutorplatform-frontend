"use client";
import { PageBackLink, PageHeader } from "@/shared/ui/page-header";
import { Select } from "@/shared/ui/form-controls";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HomeworkList, homeworkQueries, type HomeworkStatus } from "@/entities/homework";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button, buttonClassName } from "@/shared/ui/button";

const statuses: HomeworkStatus[] = ["ASSIGNED", "COMPLETED", "CANCELLED"];

const primaryLinkClassName = buttonClassName();

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
    <main className="page-stack">
      <PageHeader
        title="Домашние задания"
        description="Назначенные задания и состояние их выполнения."
        navigation={<PageBackLink href={`/teacher/students/${studentId}`}>Профиль ученика</PageBackLink>}
        actions={
          programs.data &&
          programs.data.length > 0 && (
            <Link className={primaryLinkClassName} href={`/teacher/students/${studentId}/homework/new`}>
              <Plus size={16} aria-hidden="true" />
              Назначить домашнее задание
            </Link>
          )
        }
      />

      <StudentProfileNav active="homework" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Задания ученика</h2>

              <p className="mt-1 text-sm text-foreground-muted">Фильтруйте по программе и статусу.</p>
            </div>

            <Filter size={19} className="text-foreground-subtle" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 rounded-surface bg-surface-subtle p-3">
            <Select
              aria-label="Программа"

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
            </Select>

            <Select
              aria-label="Статус"

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
            </Select>
          </div>

          <div className="mt-5">
            {homeworks.isPending && (
              <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
                Загружаем домашние задания…
              </p>
            )}

            {homeworks.isError && (
              <div className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5" role="alert">
                <p className="text-sm text-danger">Не удалось загрузить домашние задания.</p>

                <Button type="button" variant="secondary" onClick={() => homeworks.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {homeworks.data?.items.length === 0 && (
              <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-10 text-center">
                <ClipboardCheck size={28} className="mx-auto text-primary" />

                <p className="mt-4 font-semibold text-foreground">Домашних заданий пока нет</p>

                {programs.data && programs.data.length > 0 ? (
                  <Link className={`${primaryLinkClassName} mt-5`} href={`/teacher/students/${studentId}/homework/new`}>
                    Назначить домашнее задание
                  </Link>
                ) : programs.data?.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm text-foreground-muted">Сначала назначьте ученику программу обучения</p>

                    <Link
                      className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary"
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
              className="mt-5 flex items-center justify-between border-t border-border pt-5"
              aria-label="Пагинация домашних заданий"
            >
              <button
                className="rounded-surface border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition hover:bg-surface-subtle disabled:opacity-40"
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

              <span className="text-sm text-foreground-muted">
                Страница {homeworks.data.page + 1} из {homeworks.data.totalPages}
              </span>

              <button
                className="rounded-surface border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground-muted transition hover:bg-surface-subtle disabled:opacity-40"
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
          <section className="rounded-surface border border-primary-border bg-surface-subtle p-6">
            <ClipboardCheck size={20} className="text-primary" />

            <h2 className="section-title mt-4">Домашняя работа</h2>

            <div className="mt-5 flex items-end justify-between rounded-surface bg-surface/80 p-4">
              <span className="text-sm text-foreground-muted">Найдено</span>

              <span className="text-2xl font-semibold text-foreground">{homeworks.data?.totalElements ?? "—"}</span>
            </div>

            <div className="mt-3 flex items-end justify-between rounded-surface bg-surface/80 p-4">
              <span className="text-sm text-foreground-muted">Программ</span>

              <span className="text-2xl font-semibold text-foreground">{programs.data?.length ?? "—"}</span>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
