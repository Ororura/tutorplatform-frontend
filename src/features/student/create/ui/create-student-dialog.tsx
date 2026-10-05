"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import { CreateStudentForm } from "./create-student-form";

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateStudentDialog({ open: controlledOpen, onOpenChange }: Readonly<Props>) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const changeOpen = (value: boolean) => {
    setLocalOpen(value);
    onOpenChange?.(value);
  };

  const close = () => {
    changeOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  return (
    <>
      <Button ref={triggerRef} type="button" onClick={() => changeOpen(true)}>
        Добавить ученика
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="create-student-title"
        className="dialog-surface w-[min(42rem,calc(100%-2rem))]"
        onClose={() => changeOpen(false)}
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="create-student-title" className="section-title">
                Добавить ученика
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Укажите имя. Аккаунт и приглашение можно создать позже.
              </p>
            </div>
            <button
              className="rounded px-2 py-1 text-sm text-foreground-muted hover:bg-surface-subtle"
              type="button"
              onClick={close}
              aria-label="Закрыть"
            >
              Закрыть
            </button>
          </div>
          <CreateStudentForm onSuccess={close} />
        </div>
      </dialog>
    </>
  );
}
