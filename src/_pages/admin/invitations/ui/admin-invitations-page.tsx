import Link from "next/link";

import { TeacherInvitationManager } from "@/features/teacher-invitation/manage";
import { PageHeader } from "@/shared/ui/page-header";

export function AdminInvitationsPage() {
  return (
    <main className="page-content page-stack">
      <Link href="/admin" className="w-fit text-sm font-medium text-foreground-muted transition hover:text-foreground">
        ← Администрирование
      </Link>
      <PageHeader
        eyebrow="Умнее Вместе / Администрирование"
        title="Приглашения преподавателей"
        description="Создавайте ссылки для регистрации новых преподавателей и управляйте действующими приглашениями."
      />
      <TeacherInvitationManager />
    </main>
  );
}
