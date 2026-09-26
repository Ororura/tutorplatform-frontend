"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { StudentHomeworkList, studentHomeworkQueries } from "@/entities/homework";
import { StudentProgramList, studentProgramQueries } from "@/entities/student-program";
import { useCurrentUserQuery } from "@/entities/user";
import { Button } from "@/shared/ui/button";

const previewSize = 3;

function SectionLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700" href={href}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export function StudentLandingPage() {
  const currentUser = useCurrentUserQuery();
  const programs = useQuery(studentProgramQueries.currentList());
  const homeworks = useQuery(
    studentHomeworkQueries.list({
      status: "ASSIGNED",
      page: 0,
      size: previewSize,
      sort: "assignedAt,desc",
    }),
  );

  return (
    <main className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="bg-linear-to-br from-blue-600 to-indigo-600 px-6 py-8 text-white sm:px-8 sm:py-10">
          <p className="text-sm font-medium text-blue-100">Учебный кабинет</p>

          {currentUser.isPending && (
            <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl" aria-busy="true">
              Загружаем профиль…
            </p>
          )}

          {currentUser.isError && (
            <div className="mt-3 space-y-3" role="alert">
              <p className="font-medium">Не удалось загрузить профиль.</p>
              <Button type="button" variant="secondary" onClick={() => currentUser.refetch()}>
                Повторить
              </Button>
            </div>
          )}

          {currentUser.data && (
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Привет, {currentUser.data.displayName}!
            </h1>
          )}

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Здесь собраны ваши программы обучения и ближайшие домашние задания.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Мои программы</h2>
              <p className="mt-1 text-sm text-slate-500">Программы, назначенные преподавателем.</p>
            </div>
            <SectionLink href="/student/programs">Все программы</SectionLink>
          </div>

          <div className="mt-5">
            {programs.isPending && (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                Загружаем программы…
              </p>
            )}

            {programs.isError && (
              <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                <p className="text-sm text-red-700">Не удалось загрузить ваши программы.</p>
                <Button type="button" variant="secondary" onClick={() => programs.refetch()}>
                  Повторить
                </Button>
              </div>
            )}

            {programs.data?.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                <BookOpenText size={28} className="mx-auto text-blue-500" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-950">Программ пока нет</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Назначенные преподавателем программы появятся здесь.
                </p>
              </div>
            )}

            {programs.data && programs.data.length > 0 && (
              <StudentProgramList programs={programs.data.slice(0, previewSize)} />
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Домашние задания</h2>
              <p className="mt-1 text-sm text-slate-500">Задания, которые нужно выполнить.</p>
            </div>
            <SectionLink href="/student/homework">Все задания</SectionLink>
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                <ClipboardCheck size={28} className="mx-auto text-blue-500" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-950">Невыполненных заданий нет</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Новые задания преподавателя появятся здесь.</p>
              </div>
            )}

            {homeworks.data && homeworks.data.items.length > 0 && (
              <StudentHomeworkList homeworks={homeworks.data.items} />
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Быстрые действия</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            className="group flex items-center justify-between rounded-2xl border border-slate-200 p-4 font-medium text-slate-900 transition hover:border-blue-200 hover:bg-blue-50/30"
            href="/student/programs"
          >
            <span className="flex items-center gap-3">
              <BookOpenText size={20} className="text-blue-600" aria-hidden="true" />
              Открыть программы
            </span>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
          </Link>
          <Link
            className="group flex items-center justify-between rounded-2xl border border-slate-200 p-4 font-medium text-slate-900 transition hover:border-blue-200 hover:bg-blue-50/30"
            href="/student/homework"
          >
            <span className="flex items-center gap-3">
              <ClipboardCheck size={20} className="text-blue-600" aria-hidden="true" />
              Перейти к домашним заданиям
            </span>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
