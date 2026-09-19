"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { platformSettingsQueries } from "@/entities/platform-settings";
import { RegistrationModeForm } from "@/features/platform/change-registration-mode";
import { Button } from "@/shared/ui/button";

export function AdminSettingsPage() {
  const settings = useQuery(platformSettingsQueries.admin());

  return (
    <main className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Администрирование
      </Link>

      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm text-neutral-500">Tutor Learning Platform / Settings</p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Настройки платформы</h1>

        <p className="mt-3 text-neutral-600">Управление доступом к регистрации преподавателей.</p>
      </header>

      <div className="mt-8">
        {settings.isPending && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6" role="status">
            Загружаем настройки…
          </div>
        )}

        {settings.isError && (
          <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
            <p className="text-red-800">Не удалось получить настройки платформы.</p>

            <Button type="button" onClick={() => void settings.refetch()}>
              Повторить
            </Button>
          </div>
        )}

        {settings.data && (
          <div className="space-y-5">
            <RegistrationModeForm currentMode={settings.data.registrationMode} />

            <div className="text-sm text-neutral-500">
              Последнее изменение:{" "}
              {settings.data.updatedAt ? new Date(settings.data.updatedAt).toLocaleString("ru-RU") : "Нет данных"}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
