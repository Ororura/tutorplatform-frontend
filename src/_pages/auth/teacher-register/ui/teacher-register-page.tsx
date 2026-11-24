"use client";

import { PageHeader } from "@/shared/ui/page-header";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { publicRegistrationSettingsQueries } from "@/entities/platform-settings";
import { GuestGuard } from "@/entities/user";
import { RegisterTeacherForm } from "@/features/auth/register-teacher";
import { AuthShell } from "@/shared/ui/auth-shell";
import { Button, buttonClassName } from "@/shared/ui/button";
import { LoadingState } from "@/shared/ui/feedback";

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
        <LoadingState>Проверяем доступность регистрации…</LoadingState>
      </AuthShell>
    );
  }

  if (settings.isError) {
    return (
      <AuthShell>
        <div className="space-y-6">
          <PageHeader title="Не удалось проверить регистрацию" />
          <p className="page-description" role="alert">
            Проверьте подключение и попробуйте ещё раз.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void settings.refetch()}>
              Повторить
            </Button>
            <Link href="/login" className={buttonClassName("secondary")}>
              Перейти ко входу
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (settings.data.registrationMode === "INVITE_ONLY") {
    return (
      <AuthShell>
        <PageHeader
          title="Регистрация по приглашению"
          description="Получите ссылку-приглашение от администратора платформы и откройте её, чтобы создать аккаунт."
        />
        <Link href="/login" className={buttonClassName("secondary", "mt-6")}>
          Перейти ко входу
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section className="space-y-4">
        <PageHeader title="Регистрация преподавателя" description="Создайте аккаунт и начните работу с учениками." />

        <RegisterTeacherForm />
      </section>
    </AuthShell>
  );
}
