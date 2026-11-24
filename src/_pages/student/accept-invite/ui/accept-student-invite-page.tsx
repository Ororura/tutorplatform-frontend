"use client";

import { PageHeader } from "@/shared/ui/page-header";
import { useQuery } from "@tanstack/react-query";

import {
  getStudentInviteErrorMessage,
  PublicStudentInviteDetails,
  studentInviteQueries,
} from "@/entities/student-invite";
import { AcceptStudentInviteForm } from "@/features/student/invite/accept";
import { AuthShell } from "@/shared/ui/auth-shell";
import { LoadingState, ErrorState } from "@/shared/ui/feedback";

export function AcceptStudentInvitePage({ token }: Readonly<{ token: string }>) {
  const invitation = useQuery(studentInviteQueries.publicDetails(token));

  if (invitation.isPending)
    return (
      <AuthShell>
        <LoadingState>Загружаем приглашение…</LoadingState>
      </AuthShell>
    );
  if (invitation.isError)
    return (
      <AuthShell>
        <div className="space-y-6">
          <PageHeader title="Приглашение недоступно" />
          <ErrorState
            title={getStudentInviteErrorMessage(invitation.error)}
            onRetry={() => void invitation.refetch()}
            retryLabel="Проверить ещё раз"
          />
        </div>
      </AuthShell>
    );
  return (
    <AuthShell wide>
      <PageHeader title="Принять приглашение" description="Проверьте данные и создайте пароль для аккаунта ученика." />
      <div className="mt-6 space-y-6">
        <PublicStudentInviteDetails invite={invitation.data} />
        <AcceptStudentInviteForm token={token} />
      </div>
    </AuthShell>
  );
}
