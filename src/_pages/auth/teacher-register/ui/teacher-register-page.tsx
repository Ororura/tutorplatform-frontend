"use client";

import { useQuery } from "@tanstack/react-query";
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
      <main className="grid min-h-screen place-items-center px-6" aria-busy="true">
        <p className="text-sm text-neutral-600">Проверяем доступность регистрации…</p>
      </main>
    );
  }

  if (settings.isError) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md space-y-5 text-center">
          <h1 className="text-2xl font-semibold">Не удалось проверить регистрацию</h1>

          <p className="text-neutral-600" role="alert">
            Не удалось получить настройки платформы. Проверьте подключение и попробуйте ещё раз.
          </p>

          <Button type="button" variant="secondary" onClick={() => void settings.refetch()}>
            Повторить
          </Button>

          <div>
            <Link href="/login" className="text-sm font-medium underline underline-offset-4">
              Перейти ко входу
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (settings.data.registrationMode === "INVITE_ONLY") {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border border-neutral-200 bg-white p-7">
          <p className="text-sm text-neutral-500">Tutor Learning Platform</p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Регистрация по приглашению</h1>

          <p className="mt-4 leading-7 text-neutral-600">Самостоятельная регистрация преподавателей сейчас закрыта.</p>

          <p className="mt-3 leading-7 text-neutral-600">
            Для создания аккаунта получите ссылку-приглашение от администратора платформы и откройте её.
          </p>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <p className="text-sm text-neutral-600">Уже зарегистрированы?</p>

            <Link
              href="/login"
              className="mt-3 inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4"
            >
              Перейти ко входу →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Регистрация преподавателя</h1>

      <p className="mt-3 text-neutral-600">Создайте аккаунт, чтобы начать работу с учениками.</p>

      <RegisterTeacherForm />
    </main>
  );
}
