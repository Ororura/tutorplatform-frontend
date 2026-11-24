import { TeacherInvitationManager } from "@/features/teacher-invitation/manage";
import { PageBackLink, PageHeader } from "@/shared/ui/page-header";

export function AdminInvitationsPage() {
  return (
    <main className="page-content page-stack">
      <PageHeader
        navigation={<PageBackLink href="/admin">Администрирование</PageBackLink>}
        title="Приглашения преподавателей"
        description="Создавайте ссылки для регистрации новых преподавателей и управляйте действующими приглашениями."
      />
      <TeacherInvitationManager />
    </main>
  );
}
