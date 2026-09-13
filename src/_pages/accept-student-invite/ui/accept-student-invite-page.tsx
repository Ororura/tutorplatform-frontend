"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getStudentInviteErrorMessage,
  PublicStudentInviteDetails,
  studentInviteQueries,
} from "@/entities/student-invite";
import { AcceptStudentInviteForm } from "@/features/accept-student-invite";
import { Button } from "@/shared/ui/button";

export function AcceptStudentInvitePage({ token }: Readonly<{ token: string }>) {
  const invitation = useQuery(studentInviteQueries.publicDetails(token));

  if (invitation.isPending) {
    return (
      <main className="grid min-h-screen place-items-center px-6" aria-busy="true">
        <p className="text-sm text-neutral-600">Загружаем приглашение…</p>
      </main>
    );
  }

  if (invitation.isError) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md space-y-4 text-center" role="alert">
          <h1 className="text-2xl font-semibold">Приглашение недоступно</h1>
          <p className="text-neutral-600">{getStudentInviteErrorMessage(invitation.error)}</p>
          <Button type="button" onClick={() => invitation.refetch()}>
            Проверить ещё раз
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-500">Tutor Learning Platform</p>
        <h1 className="text-3xl font-semibold tracking-tight">Принять приглашение</h1>
        <p className="text-neutral-600">
          Проверьте данные и создайте пароль для аккаунта ученика.
        </p>
      </div>
      <div className="mt-8 space-y-8">
        <PublicStudentInviteDetails invite={invitation.data} />
        <AcceptStudentInviteForm token={token} />
      </div>
    </main>
  );
}
