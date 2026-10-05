"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getStudentInviteErrorMessage,
  PublicStudentInviteDetails,
  studentInviteQueries,
} from "@/entities/student-invite";
import { AcceptStudentInviteForm } from "@/features/student/invite/accept";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function AcceptStudentInvitePage({ token }: Readonly<{ token: string }>) {
  const invitation = useQuery(studentInviteQueries.publicDetails(token));

  if (invitation.isPending) {
    return (
      <main className="grid min-h-svh place-items-center px-(--page-gutter)" aria-busy="true">
        <p className="feedback">Загружаем приглашение…</p>
      </main>
    );
  }

  if (invitation.isError) {
    return (
      <main className="grid min-h-svh place-items-center px-(--page-gutter)">
        <div className="page-form surface space-y-4 text-center" role="alert">
          <h1 className="page-title">Приглашение недоступно</h1>
          <p className="text-foreground-muted">{getStudentInviteErrorMessage(invitation.error)}</p>
          <Button type="button" onClick={() => invitation.refetch()}>
            Проверить ещё раз
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-form page-stack px-(--page-gutter) py-8 sm:py-12">
      <PageHeader
        eyebrow="Умнее Вместе"
        title="Принять приглашение"
        description="Проверьте данные и создайте пароль для аккаунта ученика."
      />
      <div className="space-y-6">
        <PublicStudentInviteDetails invite={invitation.data} />
        <AcceptStudentInviteForm token={token} />
      </div>
    </main>
  );
}
