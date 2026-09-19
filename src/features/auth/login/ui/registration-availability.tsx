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
    return <p className="text-sm leading-6 text-neutral-600">Регистрация преподавателей доступна по приглашению.</p>;
  }

  return (
    <p className="text-sm text-neutral-600">
      Нет аккаунта?{" "}
      <Link className="font-medium text-neutral-900 underline underline-offset-4" href="/register">
        Зарегистрироваться
      </Link>
    </p>
  );
}
