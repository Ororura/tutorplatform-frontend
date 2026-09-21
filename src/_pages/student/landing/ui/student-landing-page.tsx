import { ArrowRight, BookOpenText, ClipboardCheck } from "lucide-react";
import Link from "next/link";

const workspaceSections = [
  {
    href: "/student/programs",
    title: "Мои программы",
    description: "Учебные программы, которые назначил преподаватель.",
    icon: BookOpenText,
  },
  {
    href: "/student/homework",
    title: "Домашние задания",
    description: "Текущие задания, сроки выполнения и результаты проверки.",
    icon: ClipboardCheck,
  },
] as const;

export function StudentLandingPage() {
  return (
    <main className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_12px_40px_rgba(45,79,135,0.06)]">
        <div className="bg-linear-to-br from-blue-600 to-indigo-600 px-6 py-8 text-white sm:px-8 sm:py-10">
          <p className="text-sm font-medium text-blue-100">Учебный кабинет</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Добро пожаловать!</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Здесь собраны ваши программы обучения и домашние задания. Выберите раздел, чтобы продолжить занятие.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Разделы кабинета">
        {workspaceSections.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-44 flex-col rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_12px_40px_rgba(45,79,135,0.06)] transition hover:border-blue-200 hover:bg-blue-50/20 sm:p-7"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className="mt-5 flex items-center justify-between gap-4">
              <span>
                <span className="block text-xl font-semibold text-slate-950">{title}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-500">{description}</span>
              </span>
              <ArrowRight
                size={20}
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
              />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
