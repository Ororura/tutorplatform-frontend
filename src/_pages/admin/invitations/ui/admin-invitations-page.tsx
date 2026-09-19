import Link from "next/link";

import { TeacherInvitationManager } from "@/features/teacher-invitation/manage";

export function AdminInvitationsPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Администрирование
      </Link>

      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm text-neutral-500">Tutor Learning Platform / Invitations</p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Приглашения преподавателей</h1>

        <p className="mt-3 max-w-2xl text-neutral-600">
          Создавайте ссылки для регистрации новых преподавателей и управляйте действующими приглашениями.
        </p>
      </header>

      <div className="mt-8">
        <TeacherInvitationManager />
      </div>
    </main>
  );
}
