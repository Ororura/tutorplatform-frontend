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
      <p className="border-t border-border pt-5 text-center text-sm leading-6 text-foreground-muted">
        Регистрация преподавателей доступна по приглашению.
      </p>
    );
  }

  return (
    <p className="border-t border-border pt-5 text-center text-sm text-foreground-muted">
      Нет аккаунта?{" "}
      <Link
        className="font-semibold text-primary transition hover:text-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring"
        href="/register"
      >
        Зарегистрироваться <span aria-hidden="true">→</span>
      </Link>
    </p>
  );
}
