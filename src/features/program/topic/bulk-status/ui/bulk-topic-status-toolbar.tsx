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
  return (
    <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3" role="region" aria-label="Выбор тем" aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={pending || empty} onClick={onToggleAll}>
          {allSelected ? "Снять все" : "Выбрать все"}
        </Button>
        <span className="text-sm" aria-live="polite">
          Выбрано: {count}
        </span>
        <Button type="button" disabled={pending || !count} onClick={() => void onSubmit("ACTIVE")}>
          Активировать
        </Button>
        <Button type="button" variant="secondary" disabled={pending || !count} onClick={() => void onSubmit("DRAFT")}>
          В черновик
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !count}
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
      {pending && (
        <p role="status" className="text-sm text-slate-500">
          Сохраняем…
        </p>
      )}
      {error && !confirming && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="archive-selected-topics"
        className="m-auto w-[min(32rem,calc(100%-2rem))] space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-xl backdrop:bg-neutral-900/35"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClose={() => setConfirming(false)}
      >
        <h2 id="archive-selected-topics" className="text-xl font-semibold">
          Архивировать выбранные темы?
        </h2>
        <p>Будут архивированы {count} тем.</p>
        {error && confirming && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => dialog.current?.close()}>
            Отмена
          </Button>
          <Button type="button" disabled={pending || !count} onClick={() => void onSubmit("ARCHIVED")}>
            {pending ? "Сохраняем…" : "Архивировать"}
          </Button>
        </div>
      </dialog>
    </div>
  );
}
