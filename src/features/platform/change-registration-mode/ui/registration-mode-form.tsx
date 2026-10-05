"use client";

import { useState } from "react";

import type { RegistrationMode } from "@/entities/platform-settings";
import { ApiClientError } from "@/shared/api/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/form-controls";
import { Surface } from "@/shared/ui/surface";

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
    <Surface>
      <div className="mb-6">
        <h2 className="section-title">Доступ к регистрации</h2>

        <p className="mt-2 text-sm text-foreground-muted">
          Выберите, кто может создавать новые аккаунты преподавателей.
        </p>
      </div>

      <fieldset className="space-y-3" disabled={mutation.isPending}>
        <legend className="sr-only">Режим регистрации</legend>

        {registrationModes.map((option) => {
          const checked = mode === option.value;

          return (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer gap-3 rounded-inset border p-4 transition-colors focus-within:border-primary focus-within:bg-primary-subtle",
                checked ? "border-primary bg-primary-subtle" : "border-border hover:border-border-strong",
              ].join(" ")}
            >
              <Input
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

                <span className="mt-1 block text-sm leading-6 text-foreground-muted">{option.description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="button" disabled={!hasChanges || mutation.isPending} onClick={() => void save()}>
          {mutation.isPending ? "Сохраняем…" : "Сохранить изменения"}
        </Button>

        {!hasChanges && !mutation.isSuccess && <span className="text-sm text-foreground-muted">Изменений нет</span>}

        {mutation.isSuccess && (
          <Badge role="status" tone="success">
            Настройки сохранены
          </Badge>
        )}
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="mt-4 rounded-inset border border-danger-border bg-danger-subtle p-3 text-sm text-danger"
        >
          {mutation.error instanceof ApiClientError
            ? mutation.error.body.message
            : "Не удалось сохранить настройки. Попробуйте ещё раз."}
        </p>
      )}
    </Surface>
  );
}
