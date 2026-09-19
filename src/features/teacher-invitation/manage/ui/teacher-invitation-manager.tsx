"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import {
  teacherInvitationQueries,
  type CreatedTeacherInvitation,
  type TeacherInvitationStatus,
} from "@/entities/teacher-invitation";

import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

import {
  useCreateTeacherInvitationMutation,
  useRevokeTeacherInvitationMutation,
} from "../api/teacher-invitation-mutations";

const statusLabels: Record<TeacherInvitationStatus, string> = {
  ACTIVE: "Активно",
  ACCEPTED: "Принято",
  REVOKED: "Отозвано",
  EXPIRED: "Истекло",
};

const statusStyles: Record<TeacherInvitationStatus, string> = {
  ACTIVE: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REVOKED: "bg-neutral-100 text-neutral-600",
  EXPIRED: "bg-amber-50 text-amber-700",
};

function formatDate(value?: string): string {
  if (!value) return "Нет данных";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Нет данных";
  }

  return date.toLocaleString("ru-RU");
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.body.code === "EMAIL_ALREADY_REGISTERED") {
      return "Пользователь с таким email уже зарегистрирован.";
    }

    if (error.body.code === "TEACHER_INVITATION_NOT_ACTIVE") {
      return "Приглашение уже использовано, отозвано или просрочено.";
    }

    return error.body.message;
  }

  return "Не удалось выполнить операцию. Попробуйте ещё раз.";
}

export function TeacherInvitationManager() {
  const invitations = useQuery(teacherInvitationQueries.list());

  const createMutation = useCreateTeacherInvitationMutation();
  const revokeMutation = useRevokeTeacherInvitationMutation();

  const [email, setEmail] = useState("");

  const [created, setCreated] = useState<CreatedTeacherInvitation | null>(null);

  const [copied, setCopied] = useState(false);

  const [createError, setCreateError] = useState<string | null>(null);

  const [revokeError, setRevokeError] = useState<string | null>(null);

  const [copyError, setCopyError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail || createMutation.isPending) {
      return;
    }

    setCreateError(null);
    setCopyError(null);
    setCopied(false);
    setCreated(null);

    try {
      const invitation = await createMutation.mutateAsync(normalizedEmail);

      setCreated(invitation);
      setEmail("");
    } catch (error) {
      setCreateError(errorMessage(error));
    }
  }

  async function handleCopy() {
    if (!created) return;

    setCopyError(null);

    try {
      await navigator.clipboard.writeText(created.invitationUrl);

      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError("Не удалось скопировать ссылку автоматически. Скопируйте её из поля.");
    }
  }

  async function handleRevoke(invitationId: string) {
    if (revokeMutation.isPending) return;

    const confirmed = window.confirm("Отозвать приглашение? После этого регистрация по ссылке станет невозможна.");

    if (!confirmed) return;

    setRevokeError(null);

    try {
      await revokeMutation.mutateAsync(invitationId);
    } catch (error) {
      setRevokeError(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Новое приглашение</h2>

        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Укажите email преподавателя. Приглашение будет привязано к этому адресу.
        </p>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => void handleCreate(event)}
        >
          <div className="flex-1">
            <label htmlFor="teacher-invitation-email" className="mb-2 block text-sm font-medium">
              Email преподавателя
            </label>

            <input
              id="teacher-invitation-email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={createMutation.isPending}
              placeholder="teacher@example.com"
              className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 outline-none focus:border-neutral-900"
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создаём…" : "Создать приглашение"}
          </Button>
        </form>

        {createError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {createError}
          </p>
        )}

        {created && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4" role="status">
            <h3 className="font-semibold text-green-900">Приглашение создано</h3>

            <p className="mt-2 text-sm text-green-800">
              Сохраните ссылку сейчас. После перезагрузки страницы получить её повторно будет нельзя.
            </p>

            <p className="mt-2 text-sm text-green-800">Email: {created.email}</p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                aria-label="Ссылка приглашения"
                value={created.invitationUrl}
                onFocus={(event) => event.target.select()}
                className="h-11 min-w-0 flex-1 rounded-lg border border-green-300 bg-white px-3 text-sm"
              />

              <Button type="button" onClick={() => void handleCopy()}>
                {copied ? "Скопировано" : "Копировать"}
              </Button>
            </div>

            {copyError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {copyError}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">История приглашений</h2>

            <p className="mt-2 text-sm text-neutral-600">Приглашения, созданные вашим аккаунтом.</p>
          </div>

          <Button type="button" disabled={invitations.isFetching} onClick={() => void invitations.refetch()}>
            {invitations.isFetching ? "Обновляем…" : "Обновить"}
          </Button>
        </div>

        {revokeError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {revokeError}
          </p>
        )}

        {invitations.isPending && (
          <p className="mt-6 text-sm text-neutral-500" role="status">
            Загружаем приглашения…
          </p>
        )}

        {invitations.isError && (
          <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Не удалось загрузить приглашения.
          </div>
        )}

        {invitations.data?.length === 0 && <p className="mt-6 text-sm text-neutral-500">Приглашений пока нет.</p>}

        {invitations.data && invitations.data.length > 0 && (
          <ul className="mt-6 divide-y divide-neutral-200">
            {invitations.data.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="break-all font-medium">{invitation.email}</p>

                    <span
                      className={["rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[invitation.status]].join(
                        " ",
                      )}
                    >
                      {statusLabels[invitation.status]}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-neutral-500">Создано: {formatDate(invitation.createdAt)}</p>

                  <p className="mt-1 text-sm text-neutral-500">Действует до: {formatDate(invitation.expiresAt)}</p>
                </div>

                {invitation.status === "ACTIVE" && (
                  <Button
                    type="button"
                    disabled={revokeMutation.isPending}
                    onClick={() => void handleRevoke(invitation.id)}
                  >
                    {revokeMutation.isPending && revokeMutation.variables === invitation.id ? "Отзываем…" : "Отозвать"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
