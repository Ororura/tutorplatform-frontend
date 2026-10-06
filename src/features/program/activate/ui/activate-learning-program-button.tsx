"use client";

import { type ComponentProps, useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useActivateLearningProgramMutation } from "../api/activate-learning-program";

type Props = {
  programId: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function ActivateLearningProgramButton({ programId, triggerVariant = "primary" }: Readonly<Props>) {
  const mutation = useActivateLearningProgramMutation();
  const [error, setError] = useState("");

  const activate = async () => {
    if (mutation.isPending) return;

    setError("");

    try {
      await mutation.mutateAsync(programId);
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        if (caught.status === 404) {
          setError("Программа больше не существует.");
          return;
        }

        if (caught.status === 409) {
          setError("Программу нельзя активировать в текущем состоянии.");
          return;
        }
      }

      setError("Не удалось активировать программу.");
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant={triggerVariant} disabled={mutation.isPending} onClick={() => void activate()}>
        {mutation.isPending ? "Активируем…" : "Активировать"}
      </Button>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
