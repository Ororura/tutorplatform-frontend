"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HomeworkList, homeworkQueries, type HomeworkStatus } from "@/entities/homework";
import { StudentProfileNav } from "@/entities/student";
import { studentProgramQueries } from "@/entities/student-program";
import { Button } from "@/shared/ui/button";

const statuses: HomeworkStatus[] = ["ASSIGNED", "COMPLETED", "CANCELLED"];
function pageFrom(value: string | null) { const parsed = Number(value); return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0; }

export function TeacherStudentHomeworksView({ studentId }: Readonly<{ studentId: string }>) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const page = pageFrom(searchParams.get("page"));
  const status = statuses.find((value) => value === searchParams.get("status"));
  const studentProgramId = searchParams.get("studentProgramId") || undefined;
  const homeworks = useQuery(homeworkQueries.list(studentId, { page, size: 20, sort: "assignedAt,desc", ...(status ? { status } : {}), ...(studentProgramId ? { studentProgramId } : {}) }));
  const programs = useQuery(studentProgramQueries.list(studentId));
  const navigate = (updates: Record<string, string | undefined>) => { const next = new URLSearchParams(searchParams.toString()); Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false }); };
  return <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
    <div><Link className="text-sm text-neutral-600 underline" href={`/teacher/students/${studentId}`}>← Профиль ученика</Link><div className="mt-4 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Домашние задания</h1>{programs.data && programs.data.length > 0 && <Link className="inline-flex h-10 items-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white" href={`/teacher/students/${studentId}/homework/new`}>Назначить домашнее задание</Link>}</div></div>
    <StudentProfileNav active="homework" studentId={studentId} />
    <div className="flex flex-wrap gap-3"><select aria-label="Программа" className="h-10 rounded-md border border-neutral-300 px-3" value={studentProgramId ?? ""} onChange={(event) => navigate({ studentProgramId: event.target.value || undefined, page: undefined })}><option value="">Все программы</option>{programs.data?.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select><select aria-label="Статус" className="h-10 rounded-md border border-neutral-300 px-3" value={status ?? ""} onChange={(event) => navigate({ status: event.target.value || undefined, page: undefined })}><option value="">Все статусы</option><option value="ASSIGNED">Назначено</option><option value="COMPLETED">Выполнено</option><option value="CANCELLED">Отменено</option></select></div>
    {homeworks.isPending && <p className="rounded-lg border p-5 text-neutral-600" aria-busy="true">Загружаем домашние задания…</p>}
    {homeworks.isError && <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5" role="alert"><p>Не удалось загрузить домашние задания.</p><Button type="button" onClick={() => homeworks.refetch()}>Повторить</Button></div>}
    {homeworks.data?.items.length === 0 && <div className="space-y-4 rounded-lg border border-dashed p-8 text-center"><p className="font-medium">Домашних заданий пока нет</p>{programs.data && programs.data.length > 0 ? <Link className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white" href={`/teacher/students/${studentId}/homework/new`}>Назначить домашнее задание</Link> : programs.data?.length === 0 ? <><p className="text-sm text-neutral-600">Сначала назначьте ученику программу обучения</p><Link className="underline" href={`/teacher/students/${studentId}/program`}>Перейти в раздел «Программа»</Link></> : null}</div>}
    {homeworks.data && homeworks.data.items.length > 0 && <HomeworkList homeworks={homeworks.data.items} studentId={studentId} />}
    {homeworks.data && homeworks.data.totalPages > 1 && <nav className="flex items-center justify-between" aria-label="Пагинация домашних заданий"><button className="rounded border px-4 py-2 text-sm disabled:opacity-50" type="button" disabled={page === 0 || homeworks.isFetching} onClick={() => navigate({ page: String(page - 1) })}>Назад</button><span className="text-sm">Страница {homeworks.data.page + 1} из {homeworks.data.totalPages}</span><button className="rounded border px-4 py-2 text-sm disabled:opacity-50" type="button" disabled={page + 1 >= homeworks.data.totalPages || homeworks.isFetching} onClick={() => navigate({ page: String(page + 1) })}>Вперёд</button></nav>}
  </main>;
}
