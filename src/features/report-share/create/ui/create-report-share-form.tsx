"use client";

import { useState, type FormEvent } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateReportShareMutation } from "../api/create-report-share";

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 409) {
    return "Публичную ссылку можно создать только для опубликованного отчёта.";
  }
  if (error instanceof ApiClientError && error.status === 400) {
    return "Дата истечения должна быть в будущем.";
  }
  return "Не удалось создать публичную ссылку. Попробуйте ещё раз.";
}

export function CreateReportShareForm({ reportId }: Readonly<{ reportId: string }>) {
  const mutation = useCreateReportShareMutation(reportId);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopyError("");
    setCopied(false);
    mutation.reset();

    const expiration = expiresAt ? new Date(expiresAt) : undefined;
    if (expiration && Number.isNaN(expiration.getTime())) {
      setError("Укажите корректную дату истечения.");
      return;
    }

    try {
      await mutation.mutateAsync(expiration?.toISOString());
      setExpiresAt("");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function copy() {
    if (!mutation.data) return;
    setCopyError("");
    try {
      await navigator.clipboard.writeText(mutation.data.shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError("Не удалось скопировать автоматически. Скопируйте ссылку из поля.");
    }
  }

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void submit(event)}>
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="report-share-expires-at">
            Дата истечения (необязательно)
          </label>
          <input
            id="report-share-expires-at"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-3 focus:ring-blue-100"
            type="datetime-local"
            value={expiresAt}
            disabled={mutation.isPending}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Создаём…" : "Создать публичную ссылку"}
        </Button>
      </form>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {mutation.data && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" role="status">
          <p className="font-medium text-emerald-900">Публичная ссылка создана</p>
          <p className="mt-1 text-sm text-emerald-800">
            Скопируйте её сейчас: в истории адрес не отображается в целях безопасности.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Публичная ссылка на отчёт"
              className="h-10 min-w-0 flex-1 rounded-xl border border-emerald-300 bg-white px-3 text-sm"
              readOnly
              value={mutation.data.shareUrl}
              onFocus={(event) => event.target.select()}
            />
            <Button type="button" onClick={() => void copy()}>
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>
          {copyError && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {copyError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
