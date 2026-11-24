import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/shared/ui/page-header";

const sections = [
  {
    href: "/admin/settings",
    title: "Настройки регистрации",
    description: "Управление открытой регистрацией и доступом по приглашениям.",
    action: "Открыть настройки",
  },
  {
    href: "/admin/invitations",
    title: "Приглашения преподавателей",
    description: "Создание приглашений, просмотр истории и отзыв действующих ссылок.",
    action: "Управлять приглашениями",
  },
] as const;

export function AdminDashboardPage() {
  return (
    <main className="page-content page-stack">
      <PageHeader title="Управление платформой" description="Настройки регистрации и приглашения преподавателей." />
      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="surface surface-interactive group flex min-h-48 flex-col"
          >
            <h2 className="section-title">{section.title}</h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-foreground-muted">{section.description}</p>

            <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-primary">
              {section.action}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
