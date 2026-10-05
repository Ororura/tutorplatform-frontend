"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import { CreateStudentInviteForm } from "./create-student-invite-form";

export function CreateStudentInviteDialog({
  studentId,
  available,
}: Readonly<{ studentId: string; available: boolean }>) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  };

  return (
    <>
      {available && (
        <Button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
          Отправить приглашение
        </Button>
      )}
      {open && (
        <dialog
          ref={dialogRef}
          aria-labelledby="create-invite-title"
          className="dialog-surface w-[min(42rem,calc(100%-2rem))]"
          onClose={close}
        >
          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="create-invite-title" className="section-title">
                  Отправить приглашение
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">Ссылка будет показана один раз после создания.</p>
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
            <CreateStudentInviteForm studentId={studentId} />
          </div>
        </dialog>
      )}
    </>
  );
}
