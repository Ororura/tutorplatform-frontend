"use client";
import { Input } from "@/shared/ui/form-controls";

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
  ACTIVE: "bg-primary-subtle text-primary",
  ACCEPTED: "bg-success-subtle text-success",
  REVOKED: "bg-surface-subtle text-foreground-muted",
  EXPIRED: "bg-warning-subtle text-warning",
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
      <section className="surface">
        <h2 className="section-title">Новое приглашение</h2>

        <p className="mt-2 text-sm leading-6 text-foreground-muted">
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

            <Input
              id="teacher-invitation-email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={createMutation.isPending}
              placeholder="teacher@example.com"
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Создаём…" : "Создать приглашение"}
          </Button>
        </form>

        {createError && (
          <p role="alert" className="mt-4 rounded-inset bg-danger-subtle p-3 text-sm text-danger">
            {createError}
          </p>
        )}

        {created && (
          <div className="mt-6 rounded-surface border border-success-border bg-success-subtle p-4" role="status">
            <h3 className="font-semibold text-success">Приглашение создано</h3>

            <p className="mt-2 text-sm text-success">
              Сохраните ссылку сейчас. После перезагрузки страницы получить её повторно будет нельзя.
            </p>

            <p className="mt-2 text-sm text-success">Email: {created.email}</p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                aria-label="Ссылка приглашения"
                value={created.invitationUrl}
                onFocus={(event) => event.target.select()}
                className="min-w-0 flex-1"
              />

              <Button type="button" onClick={() => void handleCopy()}>
                {copied ? "Скопировано" : "Копировать"}
              </Button>
            </div>

            {copyError && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {copyError}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="section-title">История приглашений</h2>

            <p className="mt-2 text-sm text-foreground-muted">Приглашения, созданные вашим аккаунтом.</p>
          </div>

          <Button type="button" disabled={invitations.isFetching} onClick={() => void invitations.refetch()}>
            {invitations.isFetching ? "Обновляем…" : "Обновить"}
          </Button>
        </div>

        {revokeError && (
          <p role="alert" className="mt-4 rounded-inset bg-danger-subtle p-3 text-sm text-danger">
            {revokeError}
          </p>
        )}

        {invitations.isPending && (
          <p className="mt-6 text-sm text-foreground-muted" role="status">
            Загружаем приглашения…
          </p>
        )}

        {invitations.isError && (
          <div role="alert" className="mt-6 rounded-inset bg-danger-subtle p-4 text-sm text-danger">
            Не удалось загрузить приглашения.
          </div>
        )}

        {invitations.data?.length === 0 && <p className="mt-6 text-sm text-foreground-muted">Приглашений пока нет.</p>}

        {invitations.data && invitations.data.length > 0 && (
          <ul className="mt-6 divide-y divide-border">
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

                  <p className="mt-2 text-sm text-foreground-muted">Создано: {formatDate(invitation.createdAt)}</p>

                  <p className="mt-1 text-sm text-foreground-muted">Действует до: {formatDate(invitation.expiresAt)}</p>
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
