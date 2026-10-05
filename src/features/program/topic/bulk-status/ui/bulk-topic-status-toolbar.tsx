"use client";

import { useRef, useState } from "react";

import { Button } from "@/shared/ui/button";
import type { BulkTopicStatusRequest } from "../api/bulk-topic-status";

type Props = {
  count: number;
  allSelected: boolean;
  empty: boolean;
  pending: boolean;
  error: string;
  onToggleAll: () => void;
  onCancel: () => void;
  onSubmit: (status: BulkTopicStatusRequest["status"]) => Promise<void>;
};

export function BulkTopicStatusToolbar({
  count,
  allSelected,
  empty,
  pending,
  error,
  onToggleAll,
  onCancel,
  onSubmit,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);
  const exceedsLimit = count > 375;
  const cannotSubmit = pending || !count || exceedsLimit;
  return (
    <div
      className="sticky top-[calc(var(--app-header-height)+0.5rem)] z-20 mt-4 space-y-2 rounded-inset border border-border bg-surface p-3"
      role="region"
      aria-label="Выбор тем"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium" aria-live="polite">
          Выбрано: {count}
        </span>
        <Button type="button" variant="ghost" disabled={pending || empty} onClick={onToggleAll}>
          {allSelected ? "Снять все" : "Выбрать все"}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={cannotSubmit} onClick={() => void onSubmit("DRAFT")}>
          В черновик
        </Button>
        <Button type="button" disabled={cannotSubmit} onClick={() => void onSubmit("ACTIVE")}>
          Активировать
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={cannotSubmit}
          onClick={() => {
            setConfirming(true);
            dialog.current?.showModal();
          }}
        >
          Архивировать
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          Отменить выбор
        </Button>
      </div>
      {exceedsLimit && (
        <p role="alert" className="text-sm text-danger">
          За один раз можно изменить статус не более 375 тем. Уменьшите выбор.
        </p>
      )}
      {pending && (
        <p role="status" className="text-sm text-foreground-muted">
          Сохраняем…
        </p>
      )}
      {error && !confirming && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="archive-selected-topics"
        className="dialog-surface w-[min(32rem,calc(100%-2rem))] space-y-5 p-6"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClose={() => setConfirming(false)}
      >
        <h2 id="archive-selected-topics" className="section-title">
          Архивировать выбранные темы?
        </h2>
        <p>Будут архивированы {count} тем.</p>
        {error && confirming && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => dialog.current?.close()}>
            Отмена
          </Button>
          <Button type="button" disabled={cannotSubmit} onClick={() => void onSubmit("ARCHIVED")}>
            {pending ? "Сохраняем…" : "Архивировать"}
          </Button>
        </div>
      </dialog>
    </div>
  );
}
