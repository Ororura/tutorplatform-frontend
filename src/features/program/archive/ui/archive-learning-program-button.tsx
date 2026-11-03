"use client";

import { useState } from "react";

import { ApiClientError } from "@/shared/api/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Button } from "@/shared/ui/button";

import { useArchiveLearningProgramMutation } from "../api/archive-learning-program";

export function ArchiveLearningProgramButton({ programId }: Readonly<{ programId: string }>) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const mutation = useArchiveLearningProgramMutation();

  const archive = async () => {
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync(programId);
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError && caught.status === 409
          ? "Программу нельзя архивировать в текущем состоянии. Обновите страницу."
          : "Не удалось архивировать программу.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="text-danger hover:bg-danger-subtle hover:text-danger"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Архивировать
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Архивировать программу?"
        description="Программа останется доступной только для чтения."
        confirmLabel="Архивировать"
        pending={mutation.isPending}
        error={error}
        onConfirm={() => void archive()}
      />
    </>
  );
}
