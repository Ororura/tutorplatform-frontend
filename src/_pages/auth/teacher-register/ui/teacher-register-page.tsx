"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import Link from "next/link";

import { publicRegistrationSettingsQueries } from "@/entities/platform-settings";
import { GuestGuard } from "@/entities/user";
import { RegisterTeacherForm } from "@/features/auth/register-teacher";
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
      <RegistrationShell>
        <section className="surface" aria-busy="true">
          <p className="text-sm font-medium text-primary">Умнее Вместе</p>
          <h1 className="page-title mt-1">Проверяем доступность регистрации</h1>
          <p className="page-description mt-2">Это займёт всего несколько секунд.</p>
        </section>
      </RegistrationShell>
    );
  }

  if (settings.isError) {
    return (
      <RegistrationShell>
        <section className="surface">
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
      </RegistrationShell>
    );
  }

  if (settings.data.registrationMode === "INVITE_ONLY") {
    return (
      <RegistrationShell>
        <section className="surface">
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
      </RegistrationShell>
    );
  }

  return (
    <RegistrationShell>
      <section className="surface">
        <h1 className="page-title">Регистрация преподавателя</h1>
        <p className="page-description mt-2">Создайте аккаунт и начните работу с учениками.</p>

        <RegisterTeacherForm />
      </section>
    </RegistrationShell>
  );
}

function RegistrationShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-(--auth-width) items-center px-4 py-6 sm:px-0">
        <Link href="/login" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-surface bg-primary text-primary-foreground">
            <BookOpen className="size-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">Умнее Вместе</span>
            <span className="block text-xs text-foreground-muted">Учиться. Развиваться. Вместе.</span>
          </span>
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-(--auth-width) flex-1 items-center px-4 py-8 sm:px-0">{children}</div>

      <footer className="mx-auto w-full max-w-(--auth-width) px-4 pb-6 text-center text-xs text-foreground-muted sm:px-0">
        © {new Date().getFullYear()} Умнее Вместе
      </footer>
    </main>
  );
}
