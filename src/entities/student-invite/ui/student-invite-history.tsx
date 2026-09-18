import type { StudentInvite } from "../api/student-invite-queries";

const statusLabels: Record<StudentInvite["status"], string> = {
  ACTIVE: "Активно",
  ACCEPTED: "Принято",
  REVOKED: "Отозвано",
  EXPIRED: "Истекло",
};

const statusClassNames: Record<StudentInvite["status"], string> = {
  ACTIVE: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REVOKED: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-amber-50 text-amber-700",
};

type Props = {
  invites: StudentInvite[];
  revokingInviteId?: string;
  onRevoke: (inviteId: string) => void;
};

export function StudentInviteHistory({ invites, revokingInviteId, onRevoke }: Readonly<Props>) {
  if (invites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-sm text-slate-500">Приглашений ещё нет.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {invites.map((invite) => (
        <li
          className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          key={invite.id}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-all font-medium text-slate-900">{invite.email}</p>

              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[invite.status]}`}>
                {statusLabels[invite.status]}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">Создано {new Date(invite.createdAt).toLocaleString("ru-RU")}</p>

            <p className="mt-1 text-xs text-slate-400">
              Действует до {new Date(invite.expiresAt).toLocaleString("ru-RU")}
            </p>
          </div>

          {invite.status === "ACTIVE" && (
            <button
              className="self-start rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
