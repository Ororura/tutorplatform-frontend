"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import Link from "next/link";

import { publicRegistrationSettingsQueries } from "@/entities/platform-settings";
import { GuestGuard } from "@/entities/user";
import { RegisterTeacherForm } from "@/features/auth/register-teacher";
import { AuthShell } from "@/shared/ui/auth-shell";
import { Button } from "@/shared/ui/button";

export function TeacherRegisterPage() {
  return (
    <GuestGuard>
      <RegistrationContent />
    </GuestGuard>
  );
}

function RegistrationContent() {
  const settings = useQuery(publicRegistrationSettingsQueries.current());

  if (settings.isPending) {
    return (
      <AuthShell>
        <section className="space-y-4" aria-busy="true">
          <p className="text-sm font-medium text-primary">Умнее Вместе</p>
          <h1 className="page-title mt-1">Проверяем доступность регистрации</h1>
          <p className="page-description mt-2">Это займёт всего несколько секунд.</p>
        </section>
      </AuthShell>
    );
  }

  if (settings.isError) {
    return (
      <AuthShell>
        <section className="space-y-4">
          <p className="text-sm font-medium text-primary">Умнее Вместе</p>
          <h1 className="page-title mt-1">Не удалось проверить регистрацию</h1>

          <p className="mt-3 text-sm leading-6 text-foreground-muted" role="alert">
            Не удалось получить настройки платформы. Проверьте подключение и попробуйте ещё раз.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => void settings.refetch()}>
              Повторить
            </Button>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-medium text-foreground-muted transition hover:bg-surface-subtle hover:text-foreground"
            >
              Перейти ко входу
            </Link>
          </div>
        </section>
      </AuthShell>
    );
  }

  if (settings.data.registrationMode === "INVITE_ONLY") {
    return (
      <AuthShell>
        <section className="space-y-4">
          <span className="grid size-11 place-items-center rounded-surface bg-primary-subtle text-primary">
            <BookOpen className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>

          <h1 className="page-title mt-5">Регистрация по приглашению</h1>

          <p className="page-description mt-2">Самостоятельная регистрация преподавателей сейчас закрыта.</p>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            Получите ссылку-приглашение от администратора платформы и откройте её, чтобы создать аккаунт.
          </p>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm text-foreground-muted">Уже зарегистрированы?</p>
            <Link
              href="/login"
              className="mt-2 inline-flex font-medium text-primary transition hover:text-primary-hover"
            >
              Перейти ко входу{" "}
              <span className="ml-1" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section className="space-y-4">
        <h1 className="page-title">Регистрация преподавателя</h1>
        <p className="page-description mt-2">Создайте аккаунт и начните работу с учениками.</p>

        <RegisterTeacherForm />
      </section>
    </AuthShell>
  );
}
