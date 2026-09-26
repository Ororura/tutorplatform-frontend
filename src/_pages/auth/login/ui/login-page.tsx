import { Suspense } from "react";
import { BookOpen, ChartNoAxesColumnIncreasing, Heart, UsersRound } from "lucide-react";

import { GuestGuard } from "@/entities/user";
import { LoginForm } from "@/features/auth/login";

import { LearningIllustration } from "./learning-illustration";

const benefits = [
  {
    title: "Онлайн-занятия",
    description: "Где угодно и когда удобно",
    icon: UsersRound,
    color: "text-blue-600",
    background: "bg-blue-100/70",
  },
  {
    title: "Развитие навыков",
    description: "Шаг за шагом к целям",
    icon: ChartNoAxesColumnIncreasing,
    color: "text-sky-600",
    background: "bg-sky-100/70",
  },
  {
    title: "Поддержка",
    description: "Мы рядом на каждом этапе",
    icon: Heart,
    color: "text-violet-600",
    background: "bg-violet-100/70",
  },
] as const;

export function LoginPage() {
  return (
    <GuestGuard>
      <main className="relative flex min-h-svh flex-col overflow-x-hidden bg-[linear-gradient(125deg,#f8fbff_0%,#eef6ff_47%,#f7faff_100%)] text-slate-950">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_53%_15%,rgba(255,255,255,0.96),transparent_28%),radial-gradient(circle_at_8%_74%,rgba(219,234,254,0.66),transparent_30%)]"
          aria-hidden="true"
        />

        <header className="relative z-10 mx-auto flex w-full max-w-[1500px] shrink-0 items-center justify-between px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200/70">
              <BookOpen className="size-6" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Tutor Learning Platform</p>
              <p className="hidden text-xs text-slate-500 sm:block">Учиться. Развиваться. Вместе.</p>
            </div>
          </div>

          <div className="hidden items-center gap-4 text-xs text-slate-500 md:flex">
            <span>Больше, чем обучение</span>
            <span className="h-px w-10 bg-slate-300" aria-hidden="true" />
            <Heart className="size-5 text-blue-600" strokeWidth={1.8} aria-hidden="true" />
          </div>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-[1500px] flex-none items-start px-5 pt-4 pb-8 sm:px-8 sm:pt-6 lg:flex-1 lg:grid-cols-[minmax(250px,0.72fr)_minmax(430px,510px)] lg:items-center lg:gap-10 lg:px-10 lg:pt-0 xl:grid-cols-[minmax(280px,0.72fr)_minmax(450px,510px)_minmax(350px,0.95fr)] xl:gap-12">
          <section className="hidden max-w-[350px] lg:block" aria-labelledby="login-intro-title">
            <h1
              id="login-intro-title"
              className="text-[clamp(2.6rem,3.3vw,4rem)] leading-[1.08] font-bold tracking-[-0.045em] text-slate-900"
            >
              Знания создают
              <br />
              большие <span className="text-blue-600">возможности</span>
            </h1>
            <p className="mt-6 max-w-[330px] text-base leading-7 text-slate-600">
              Удобная платформа для обучения и преподавания. Развивайтесь, достигайте целей и открывайте новые горизонты
              вместе с нами.
            </p>
            <span className="mt-6 block h-1 w-11 rounded-full bg-blue-300" aria-hidden="true" />

            <ul className="mt-11 space-y-5">
              {benefits.map(({ title, description, icon: Icon, color, background }) => (
                <li key={title} className="flex items-center gap-4">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${background} ${color}`}>
                    <Icon className="size-6" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{title}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto w-full max-w-[510px] rounded-[24px] border border-white/90 bg-white/90 p-5 shadow-[0_24px_70px_-30px_rgba(30,64,175,0.38)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-8 lg:p-9">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.15rem]">Вход</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                  Войдите в аккаунт преподавателя или ученика.
                </p>
              </div>
              <span className="hidden size-16 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 sm:grid">
                <BookOpen className="size-8" strokeWidth={1.7} aria-hidden="true" />
              </span>
            </div>

            <Suspense fallback={<p className="mt-8 text-sm text-slate-500">Загружаем форму…</p>}>
              <LoginForm />
            </Suspense>
          </section>

          <aside className="relative hidden h-full min-h-[610px] items-center xl:flex" aria-hidden="true">
            <LearningIllustration />
          </aside>
        </div>

        <footer className="relative z-10 mx-auto mt-auto flex w-full max-w-[1500px] shrink-0 flex-col gap-2 px-5 pb-5 text-center text-xs text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between md:text-left lg:px-10 lg:pb-7">
          <p>© {new Date().getFullYear()} Tutor Learning Platform. Все права защищены.</p>
          <p>Обучение, которое открывает возможности</p>
        </footer>
      </main>
    </GuestGuard>
  );
}
