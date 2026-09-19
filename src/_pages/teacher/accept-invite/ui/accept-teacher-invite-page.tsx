"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { getTeacherInvitationErrorMessage, publicTeacherInvitationQueries } from "@/entities/teacher-invitation";

import { GuestGuard } from "@/entities/user";

import { AcceptTeacherInvitationForm } from "@/features/teacher-invitation/accept";

import { Button } from "@/shared/ui/button";

const unavailableMessages = {
  ACCEPTED: "Это приглашение уже было использовано.",

  REVOKED: "Администратор отозвал приглашение.",

  EXPIRED: "Срок действия приглашения истёк.",
} as const;

type Props = {
  token: string;
};

export function AcceptTeacherInvitePage({ token }: Readonly<Props>) {
  return (
    <GuestGuard>
      <InvitationContent token={token} />
    </GuestGuard>
  );
}

function InvitationContent({ token }: Readonly<Props>) {
  const invitation = useQuery(publicTeacherInvitationQueries.details(token));

  if (invitation.isPending) {
    return (
      <main className="grid min-h-screen place-items-center px-6" aria-busy="true">
        <p className="text-sm text-neutral-600">Проверяем приглашение…</p>
      </main>
    );
  }

  if (invitation.isError) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md space-y-5 text-center">
          <h1 className="text-2xl font-semibold">Приглашение недоступно</h1>

          <p role="alert" className="text-neutral-600">
            {getTeacherInvitationErrorMessage(invitation.error)}
          </p>

          <Button type="button" variant="secondary" onClick={() => void invitation.refetch()}>
            Проверить ещё раз
          </Button>
        </div>
      </main>
    );
  }

  if (invitation.data.status !== "ACTIVE") {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md space-y-5 text-center">
          <h1 className="text-2xl font-semibold">Приглашение недействительно</h1>

          <p className="text-neutral-600">{unavailableMessages[invitation.data.status]}</p>

          <Link href="/login" className="inline-block text-sm font-medium underline underline-offset-4">
            Перейти ко входу
          </Link>
        </div>
      </main>
    );
  }

  const expiresAt = new Date(invitation.data.expiresAt);

  return (
    <main className="mx-auto max-w-xl px-6 py-12 sm:py-16">
      <header className="border-b border-neutral-200 pb-8">
        <p className="text-sm text-neutral-500">Tutor Learning Platform</p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Присоединиться к платформе</h1>

        <p className="mt-3 text-neutral-600">Вас пригласили зарегистрироваться в качестве преподавателя.</p>
      </header>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-sm text-neutral-500">Email аккаунта</p>

        <p className="mt-1 break-all font-medium">{invitation.data.email}</p>

        <p className="mt-4 text-sm text-neutral-500">Приглашение действительно до</p>

        <p className="mt-1 text-sm font-medium">
          {Number.isNaN(expiresAt.getTime()) ? "Нет данных" : expiresAt.toLocaleString("ru-RU")}
        </p>

        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Этот email привязан к приглашению. Изменить его при регистрации нельзя.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-6 text-xl font-semibold">Создание аккаунта</h2>

        <AcceptTeacherInvitationForm token={token} />
      </section>

      <p className="mt-8 text-sm text-neutral-600">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-neutral-900 underline underline-offset-4">
          Войти
        </Link>
      </p>
    </main>
  );
}
