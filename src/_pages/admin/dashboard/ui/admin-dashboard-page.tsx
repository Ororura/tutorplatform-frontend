import Link from "next/link";

const sections = [
  {
    href: "/admin/settings",
    number: "01",
    title: "Настройки регистрации",
    description: "Управление открытой регистрацией и доступом по приглашениям.",
    action: "Открыть настройки",
  },
  {
    href: "/admin/invitations",
    number: "02",
    title: "Приглашения преподавателей",
    description: "Создание приглашений, просмотр истории и отзыв действующих ссылок.",
    action: "Управлять приглашениями",
  },
] as const;

export function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <header className="border-b border-neutral-200 pb-8">
        <p className="text-sm text-neutral-500">Tutor Learning Platform / Administration</p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Управление платформой</h1>

        <p className="mt-3 text-neutral-600">Настройки регистрации и приглашения преподавателей.</p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex min-h-56 flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-blue-300"
          >
            <span className="text-xs font-medium text-neutral-400">{section.number}</span>

            <h2 className="mt-5 text-xl font-semibold text-neutral-950">{section.title}</h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-600">{section.description}</p>

            <span className="mt-auto pt-6 text-sm font-medium text-blue-700">{section.action} →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
