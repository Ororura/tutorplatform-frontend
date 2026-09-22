"use client";

import { useState, type FormEvent } from "react";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import { useCreateProgressShareMutation } from "../api/create-progress-share";

function getErrorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.body.message : "Не удалось создать публичную ссылку.";
}

export function CreateProgressShareForm({
  studentId,
  studentProgramId,
}: Readonly<{ studentId: string; studentProgramId: string }>) {
  const mutation = useCreateProgressShareMutation(studentId, studentProgramId);
  const [expiresAt, setExpiresAt] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setCopyError(null);
    setCopied(false);
    mutation.reset();

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null;
    if (parsedExpiresAt && Number.isNaN(parsedExpiresAt.getTime())) {
      setErrorMessage("Укажите корректную дату истечения.");
      return;
    }

    try {
      await mutation.mutateAsync(parsedExpiresAt?.toISOString());
      setExpiresAt("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleCopy() {
    if (!mutation.data) return;

    setCopyError(null);
    try {
      await navigator.clipboard.writeText(mutation.data.shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError("Не удалось скопировать ссылку автоматически. Скопируйте её из поля.");
    }
  }

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="progress-share-expires-at">
            Дата истечения (необязательно)
          </label>
          <input
            id="progress-share-expires-at"
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

      {errorMessage && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}

      {mutation.data && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" role="status">
          <p className="font-medium text-emerald-900">Публичная ссылка создана</p>
          <p className="mt-1 text-sm text-emerald-800">
            Скопируйте её сейчас: после перезагрузки получить адрес повторно нельзя.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Публичная ссылка на прогресс"
              className="h-10 min-w-0 flex-1 rounded-xl border border-emerald-300 bg-white px-3 text-sm"
              readOnly
              value={mutation.data.shareUrl}
              onFocus={(event) => event.target.select()}
            />
            <Button type="button" onClick={() => void handleCopy()}>
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
