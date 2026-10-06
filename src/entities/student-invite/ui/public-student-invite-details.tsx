import type { PublicStudentInvite } from "../api/student-invite-queries";

export function PublicStudentInviteDetails({ invite }: Readonly<{ invite: PublicStudentInvite }>) {
  const studentName = [invite.student.firstName, invite.student.lastName].filter(Boolean).join(" ");
  const expiration = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(invite.expiresAt));

  return (
    <dl className="grid gap-4 rounded-surface border border-border bg-surface p-5 sm:grid-cols-2">
      <div>
        <dt className="text-sm text-foreground-muted">Ученик</dt>
        <dd className="mt-1 font-medium">{studentName}</dd>
      </div>
      <div>
        <dt className="text-sm text-foreground-muted">Преподаватель</dt>
        <dd className="mt-1 font-medium">{invite.teacher.displayName}</dd>
      </div>
      <div>
        <dt className="text-sm text-foreground-muted">Email</dt>
        <dd className="mt-1 break-all font-medium">{invite.email}</dd>
      </div>
      <div>
        <dt className="text-sm text-foreground-muted">Действительно до</dt>
        <dd className="mt-1 font-medium">{expiration}</dd>
      </div>
    </dl>
  );
}
