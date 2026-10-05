import Link from "next/link";

import { PageHeader } from "@/shared/ui/page-header";

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
    <main className="page-content page-stack">
      <PageHeader
        eyebrow="Умнее Вместе / Администрирование"
        title="Управление платформой"
        description="Настройки регистрации и приглашения преподавателей."
      />
      <section className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="surface surface-interactive group flex min-h-48 flex-col"
          >
            <span className="text-xs font-medium text-foreground-subtle">{section.number}</span>

            <h2 className="card-title mt-5">{section.title}</h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-foreground-muted">{section.description}</p>

            <span className="mt-auto pt-6 text-sm font-medium text-primary">{section.action} →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
