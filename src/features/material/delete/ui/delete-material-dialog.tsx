"use client";

import { type ReactNode, useState } from "react";

import type { LessonMaterial } from "@/entities/material";
import { ApiClientError } from "@/shared/api/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Button } from "@/shared/ui/button";

import { useDeleteMaterialMutation } from "../api/delete-material";

export function DeleteMaterialDialog({
  material,
  renderTrigger,
}: Readonly<{ material: LessonMaterial; renderTrigger?: (open: () => void) => ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const mutation = useDeleteMaterialMutation(material.topicId);

  const confirmDeletion = async () => {
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync(material.id);
      setOpen(false);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 404) {
        setError("Материал уже удалён или недоступен. Обновите страницу.");
      } else {
        setError("Не удалось удалить материал. Попробуйте ещё раз.");
      }
    }
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => {
          setError("");
          setOpen(true);
        })
      ) : (
        <Button
          type="button"
          variant="secondary"
          aria-label={`Удалить «${material.title}»`}
          onClick={() => {
            setError("");
            setOpen(true);
          }}
        >
          Удалить
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Удалить материал"
        description={<>Вы действительно хотите удалить «{material.title}»? Это действие нельзя отменить.</>}
        confirmLabel="Удалить материал"
        pending={mutation.isPending}
        error={error}
        onConfirm={() => void confirmDeletion()}
      />
    </>
  );
}
