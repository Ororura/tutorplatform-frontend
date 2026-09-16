import type { StudentInvite } from "../api/student-invite-queries";

const statusLabels: Record<StudentInvite["status"], string> = {
  ACTIVE: "Активно",
  ACCEPTED: "Принято",
  REVOKED: "Отозвано",
  EXPIRED: "Истекло",
};

type Props = {
  invites: StudentInvite[];
  revokingInviteId?: string;
  onRevoke: (inviteId: string) => void;
};

export function StudentInviteHistory({ invites, revokingInviteId, onRevoke }: Readonly<Props>) {
  if (invites.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-5 text-neutral-600">Приглашений ещё нет.</p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      {invites.map((invite) => (
        <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={invite.id}>
          <div>
            <p className="font-medium">{invite.email}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {statusLabels[invite.status]} · создано {new Date(invite.createdAt).toLocaleString("ru-RU")}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Действует до {new Date(invite.expiresAt).toLocaleString("ru-RU")}
            </p>
          </div>
          {invite.status === "ACTIVE" && (
            <button
              className="self-start rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
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
