"use client";

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
        <h1 className="page-title mb-4">Приглашение недоступно</h1>
        <ErrorState
          title={getStudentInviteErrorMessage(invitation.error)}
          onRetry={() => void invitation.refetch()}
          retryLabel="Проверить ещё раз"
        />
      </AuthShell>
    );
  return (
    <AuthShell wide>
      <h1 className="page-title">Принять приглашение</h1>
      <p className="page-description mt-2">Проверьте данные и создайте пароль для аккаунта ученика.</p>
      <div className="mt-6 space-y-6">
        <PublicStudentInviteDetails invite={invitation.data} />
        <AcceptStudentInviteForm token={token} />
      </div>
    </AuthShell>
  );
}
