"use client";

import { useState } from "react";

import type { RegistrationMode } from "@/entities/platform-settings";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useChangeRegistrationModeMutation } from "../api/change-registration-mode";

const registrationModes = [
  {
    value: "OPEN",
    title: "Открытая регистрация",
    description: "Новые преподаватели могут самостоятельно создавать аккаунты.",
  },
  {
    value: "INVITE_ONLY",
    title: "Регистрация по приглашению",
    description: "Новые преподаватели могут зарегистрироваться только по ссылке администратора.",
  },
] as const satisfies ReadonlyArray<{
  value: RegistrationMode;
  title: string;
  description: string;
}>;

type Props = {
  currentMode: RegistrationMode;
};

export function RegistrationModeForm({ currentMode }: Readonly<Props>) {
  const [selectedMode, setSelectedMode] = useState<RegistrationMode | null>(null);

  const mutation = useChangeRegistrationModeMutation();

  const mode = selectedMode ?? currentMode;

  const hasChanges = mode !== currentMode;

  async function save() {
    if (!hasChanges || mutation.isPending) {
      return;
    }

    try {
      await mutation.mutateAsync(mode);
      setSelectedMode(null);
    } catch {
      // The mutation error is displayed below the form.
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Доступ к регистрации</h2>

        <p className="mt-2 text-sm text-neutral-600">Выберите, кто может создавать новые аккаунты преподавателей.</p>
      </div>

      <fieldset className="space-y-3" disabled={mutation.isPending}>
        <legend className="sr-only">Режим регистрации</legend>

        {registrationModes.map((option) => {
          const checked = mode === option.value;

          return (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors",
                checked ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400",
              ].join(" ")}
            >
              <input
                type="radio"
                name="registrationMode"
                value={option.value}
                checked={checked}
                onChange={() => {
                  setSelectedMode(option.value);
                  mutation.reset();
                }}
                className="mt-1"
              />

              <span>
                <span className="block font-medium">{option.title}</span>

                <span className="mt-1 block text-sm leading-6 text-neutral-600">{option.description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="button" disabled={!hasChanges || mutation.isPending} onClick={() => void save()}>
          {mutation.isPending ? "Сохраняем…" : "Сохранить изменения"}
        </Button>

        {!hasChanges && !mutation.isSuccess && <span className="text-sm text-neutral-500">Изменений нет</span>}

        {mutation.isSuccess && (
          <span role="status" className="text-sm text-green-700">
            Настройки сохранены
          </span>
        )}
      </div>

      {mutation.isError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {mutation.error instanceof ApiClientError
            ? mutation.error.body.message
            : "Не удалось сохранить настройки. Попробуйте ещё раз."}
        </p>
      )}
    </section>
  );
}
