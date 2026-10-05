"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { platformSettingsQueries } from "@/entities/platform-settings";
import { RegistrationModeForm } from "@/features/platform/change-registration-mode";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function AdminSettingsPage() {
  const settings = useQuery(platformSettingsQueries.admin());

  return (
    <main className="page-form page-stack">
      <Link href="/admin" className="w-fit text-sm font-medium text-foreground-muted transition hover:text-foreground">
        ← Администрирование
      </Link>
      <PageHeader
        eyebrow="Умнее Вместе / Администрирование"
        title="Настройки платформы"
        description="Управление доступом к регистрации преподавателей."
      />
      <div>
        {settings.isPending && (
          <div className="feedback" role="status">
            Загружаем настройки…
          </div>
        )}

        {settings.isError && (
          <div className="space-y-4 rounded-surface border border-danger-border bg-danger-subtle p-6" role="alert">
            <p className="text-danger">Не удалось получить настройки платформы.</p>

            <Button type="button" onClick={() => void settings.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {settings.data && (
          <div className="space-y-5">
            <RegistrationModeForm currentMode={settings.data.registrationMode} />

            <div className="text-sm text-foreground-muted">
              Последнее изменение:{" "}
              {settings.data.updatedAt ? new Date(settings.data.updatedAt).toLocaleString("ru-RU") : "Нет данных"}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
