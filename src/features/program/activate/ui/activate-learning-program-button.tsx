"use client";

import { useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useActivateLearningProgramMutation } from "../api/activate-learning-program";

type Props = {
  programId: string;
};

export function ActivateLearningProgramButton({ programId }: Readonly<Props>) {
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
      <Button type="button" disabled={mutation.isPending} onClick={() => void activate()}>
        {mutation.isPending ? "Активируем…" : "Активировать"}
      </Button>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
