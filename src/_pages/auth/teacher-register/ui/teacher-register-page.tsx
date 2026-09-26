"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChartNoAxesColumnIncreasing, Heart, UsersRound } from "lucide-react";
import Link from "next/link";

import { publicRegistrationSettingsQueries } from "@/entities/platform-settings";
import { GuestGuard } from "@/entities/user";
import { RegisterTeacherForm } from "@/features/auth/register-teacher";
import { Button } from "@/shared/ui/button";

const benefits = [
  {
    title: "Ученики в одном месте",
    description: "Программы, занятия и домашние задания без лишних таблиц",
    icon: UsersRound,
    color: "text-blue-600",
    background: "bg-blue-100/70",
  },
  {
    title: "Прогресс под рукой",
    description: "Следите за результатами и следующими шагами ученика",
    icon: ChartNoAxesColumnIncreasing,
    color: "text-sky-600",
    background: "bg-sky-100/70",
  },
  {
    title: "Фокус на обучении",
    description: "Платформа берёт на себя рутину вокруг учебного процесса",
    icon: Heart,
    color: "text-violet-600",
    background: "bg-violet-100/70",
  },
] as const;

export function TeacherRegisterPage() {
  return (
    <GuestGuard>
      <RegistrationContent />
    </GuestGuard>
  );
}

function RegistrationContent() {
  const settings = useQuery(publicRegistrationSettingsQueries.current());

  if (settings.isPending) {
    return (
      <RegistrationShell>
        <section
          className="mx-auto w-full max-w-[560px] rounded-[24px] border border-white/90 bg-white/90 p-6 shadow-[0_24px_70px_-30px_rgba(30,64,175,0.38)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-9"
          aria-busy="true"
        >
          <p className="text-sm font-medium text-blue-600">Tutor Learning Platform</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Проверяем доступность регистрации
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Это займёт всего несколько секунд.</p>
        </section>
      </RegistrationShell>
    );
  }

  if (settings.isError) {
    return (
      <RegistrationShell>
        <section className="mx-auto w-full max-w-[560px] rounded-[24px] border border-white/90 bg-white/90 p-6 shadow-[0_24px_70px_-30px_rgba(30,64,175,0.38)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-9">
          <p className="text-sm font-medium text-blue-600">Tutor Learning Platform</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Не удалось проверить регистрацию
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base" role="alert">
            Не удалось получить настройки платформы. Проверьте подключение и попробуйте ещё раз.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-11 rounded-xl bg-blue-600 px-5 shadow-lg shadow-blue-200/70 hover:bg-blue-700"
              type="button"
              onClick={() => void settings.refetch()}
            >
              Повторить
            </Button>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              Перейти ко входу
            </Link>
          </div>
        </section>
      </RegistrationShell>
    );
  }

  if (settings.data.registrationMode === "INVITE_ONLY") {
    return (
      <RegistrationShell>
        <section className="mx-auto w-full max-w-[560px] rounded-[24px] border border-white/90 bg-white/90 p-6 shadow-[0_24px_70px_-30px_rgba(30,64,175,0.38)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-9">
          <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen className="size-7" strokeWidth={1.8} aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.15rem]">
            Регистрация по приглашению
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Самостоятельная регистрация преподавателей сейчас закрыта.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            Получите ссылку-приглашение от администратора платформы и откройте её, чтобы создать аккаунт.
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">Уже зарегистрированы?</p>
            <Link
              href="/login"
              className="mt-3 inline-flex font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              Перейти ко входу <span className="ml-1" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell>
      <section className="mx-auto w-full max-w-[560px] rounded-[24px] border border-white/90 bg-white/90 p-5 shadow-[0_24px_70px_-30px_rgba(30,64,175,0.38)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-8 lg:p-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.15rem]">
              Регистрация преподавателя
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Создайте аккаунт и начните работу с учениками.
            </p>
          </div>

          <span className="hidden size-16 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 sm:grid">
            <BookOpen className="size-8" strokeWidth={1.7} aria-hidden="true" />
          </span>
        </div>

        <RegisterTeacherForm />
      </section>
    </RegistrationShell>
  );
}

function RegistrationShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="relative flex min-h-svh flex-col overflow-x-hidden bg-[linear-gradient(125deg,#f8fbff_0%,#eef6ff_47%,#f7faff_100%)] text-slate-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_53%_15%,rgba(255,255,255,0.96),transparent_28%),radial-gradient(circle_at_8%_74%,rgba(219,234,254,0.66),transparent_30%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] shrink-0 items-center justify-between px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200/70">
            <BookOpen className="size-6" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Tutor Learning Platform
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">Учиться. Развиваться. Вместе.</span>
          </span>
        </Link>

        <div className="hidden items-center gap-4 text-xs text-slate-500 md:flex">
          <span>Больше, чем обучение</span>
          <span className="h-px w-10 bg-slate-300" aria-hidden="true" />
          <Heart className="size-5 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] flex-none items-start gap-10 px-5 pt-3 pb-8 sm:px-8 sm:pt-6 lg:flex-1 lg:grid-cols-[minmax(300px,0.8fr)_minmax(460px,560px)] lg:items-center lg:px-10 lg:pt-0 xl:gap-16">
        <section className="hidden max-w-[410px] lg:block" aria-labelledby="register-intro-title">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Для преподавателей</p>
          <h2
            id="register-intro-title"
            className="text-[clamp(2.6rem,3.7vw,4.2rem)] leading-[1.06] font-bold tracking-[-0.045em] text-slate-900"
          >
            Учебный процесс
            <br />
            становится <span className="text-blue-600">понятнее</span>
          </h2>
          <p className="mt-6 max-w-[380px] text-base leading-7 text-slate-600">
            Создавайте программы, выдавайте задания и отслеживайте прогресс учеников в одном рабочем пространстве.
          </p>
          <span className="mt-6 block h-1 w-11 rounded-full bg-blue-300" aria-hidden="true" />

          <ul className="mt-10 space-y-5">
            {benefits.map(({ title, description, icon: Icon, color, background }) => (
              <li key={title} className="flex items-center gap-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${background} ${color}`}>
                  <Icon className="size-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-slate-500">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {children}
      </div>

      <footer className="relative z-10 mx-auto mt-auto flex w-full max-w-[1280px] shrink-0 flex-col gap-2 px-5 pb-5 text-center text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between md:text-left lg:px-10 lg:pb-7">
        <p>© {new Date().getFullYear()} Tutor Learning Platform. Все права защищены.</p>
        <p>Обучение, которое открывает возможности</p>
      </footer>
    </main>
  );
}
