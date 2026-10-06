"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { getTeacherInvitationErrorMessage, publicTeacherInvitationQueries } from "@/entities/teacher-invitation";

import { GuestGuard } from "@/entities/user";

import { AcceptTeacherInvitationForm } from "@/features/teacher-invitation/accept";

import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { Surface } from "@/shared/ui/surface";

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
      <main className="grid min-h-svh place-items-center px-(--page-gutter)" aria-busy="true">
        <p className="feedback">Проверяем приглашение…</p>
      </main>
    );
  }

  if (invitation.isError) {
    return (
      <main className="grid min-h-svh place-items-center px-(--page-gutter)">
        <div className="page-form surface space-y-5 text-center">
          <h1 className="page-title">Приглашение недоступно</h1>

          <p role="alert" className="text-foreground-muted">
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
      <main className="grid min-h-svh place-items-center px-(--page-gutter)">
        <div className="page-form surface space-y-5 text-center">
          <h1 className="page-title">Приглашение недействительно</h1>

          <p className="text-foreground-muted">{unavailableMessages[invitation.data.status]}</p>

          <Link href="/login" className="inline-block text-sm font-medium underline underline-offset-4">
            Перейти ко входу
          </Link>
        </div>
      </main>
    );
  }

  const expiresAt = new Date(invitation.data.expiresAt);

  return (
    <main className="page-form page-stack px-(--page-gutter) py-8 sm:py-12">
      <PageHeader
        eyebrow="Умнее Вместе"
        title="Присоединиться к платформе"
        description="Вас пригласили зарегистрироваться в качестве преподавателя."
      />
      <Surface inset>
        <p className="text-sm text-foreground-muted">Email аккаунта</p>

        <p className="mt-1 break-all font-medium">{invitation.data.email}</p>

        <p className="mt-4 text-sm text-foreground-muted">Приглашение действительно до</p>

        <p className="mt-1 text-sm font-medium">
          {Number.isNaN(expiresAt.getTime()) ? "Нет данных" : expiresAt.toLocaleString("ru-RU")}
        </p>

        <p className="mt-4 text-sm leading-6 text-foreground-muted">
          Этот email привязан к приглашению. Изменить его при регистрации нельзя.
        </p>
      </Surface>

      <section>
        <h2 className="section-title mb-5">Создание аккаунта</h2>

        <AcceptTeacherInvitationForm token={token} />
      </section>

      <p className="text-sm text-foreground-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Войти
        </Link>
      </p>
    </main>
  );
}
