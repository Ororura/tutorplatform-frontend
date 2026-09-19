"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { publicRegistrationSettingsQueries } from "@/entities/platform-settings";

export function RegistrationAvailability() {
  const settings = useQuery(publicRegistrationSettingsQueries.current());

  if (settings.isPending || settings.isFetching || settings.isError) {
    return null;
  }

  if (settings.data.registrationMode === "INVITE_ONLY") {
    return (
      <p className="border-t border-slate-200 pt-5 text-center text-sm leading-6 text-slate-500">
        Регистрация преподавателей доступна по приглашению.
      </p>
    );
  }

  return (
    <p className="border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
      Нет аккаунта?{" "}
      <Link
        className="font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        href="/register"
      >
        Зарегистрироваться <span aria-hidden="true">→</span>
      </Link>
    </p>
  );
}
