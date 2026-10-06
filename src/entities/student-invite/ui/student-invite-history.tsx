import type { StudentInvite } from "../api/student-invite-queries";

const statusLabels: Record<StudentInvite["status"], string> = {
  ACTIVE: "Активно",
  ACCEPTED: "Принято",
  REVOKED: "Отозвано",
  EXPIRED: "Истекло",
};

const statusClassNames: Record<StudentInvite["status"], string> = {
  ACTIVE: "bg-primary-subtle text-primary",
  ACCEPTED: "bg-success-subtle text-success",
  REVOKED: "bg-surface-subtle text-foreground-muted",
  EXPIRED: "bg-warning-subtle text-warning",
};

type Props = {
  invites: StudentInvite[];
  revokingInviteId?: string;
  onRevoke: (inviteId: string) => void;
};

export function StudentInviteHistory({ invites, revokingInviteId, onRevoke }: Readonly<Props>) {
  if (invites.length === 0) {
    return (
      <div className="rounded-surface border border-dashed border-border bg-surface-subtle/60 p-6 text-center">
        <p className="text-sm text-foreground-muted">Приглашений ещё нет.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {invites.map((invite) => (
        <li
          className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          key={invite.id}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-all font-medium text-foreground">{invite.email}</p>

              <span className={`badge  ${statusClassNames[invite.status]}`}>{statusLabels[invite.status]}</span>
            </div>

            <p className="mt-2 text-sm text-foreground-muted">
              Создано {new Date(invite.createdAt).toLocaleString("ru-RU")}
            </p>

            <p className="mt-1 text-xs text-foreground-subtle">
              Действует до {new Date(invite.expiresAt).toLocaleString("ru-RU")}
            </p>
          </div>

          {invite.status === "ACTIVE" && (
            <button
              className="self-start rounded-surface border border-danger-border bg-surface px-3 py-2 text-sm font-medium text-danger transition hover:bg-danger-subtle disabled:opacity-50"
              type="button"
              disabled={revokingInviteId === invite.id}
              onClick={() => onRevoke(invite.id)}
            >
              {revokingInviteId === invite.id ? "Отзываем…" : "Отозвать"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
