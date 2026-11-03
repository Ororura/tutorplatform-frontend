"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useRef, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Подтвердить",
  pending = false,
  error,
  onConfirm,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  error?: string;
  onConfirm: () => void;
}>) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay/45" />
        <AlertDialog.Content
          data-slot="alert-dialog-content"
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current?.focus();
          }}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-6 rounded-xl border border-border bg-card p-6 shadow-(--shadow-floating) focus:outline-none"
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <div className="space-y-2">
            <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-danger-subtle p-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={pending}>
                Отмена
              </Button>
            </AlertDialog.Cancel>
            <Button variant="danger" loading={pending} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
