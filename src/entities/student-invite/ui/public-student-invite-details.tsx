import type { PublicStudentInvite } from "../api/student-invite-queries";

export function PublicStudentInviteDetails({ invite }: Readonly<{ invite: PublicStudentInvite }>) {
  const studentName = [invite.student.firstName, invite.student.lastName].filter(Boolean).join(" ");
  const expiration = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(invite.expiresAt));

  return (
    <dl className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2">
      <div>
        <dt className="text-sm text-neutral-500">Ученик</dt>
        <dd className="mt-1 font-medium">{studentName}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Преподаватель</dt>
        <dd className="mt-1 font-medium">{invite.teacher.displayName}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Email</dt>
        <dd className="mt-1 break-all font-medium">{invite.email}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Действительно до</dt>
        <dd className="mt-1 font-medium">{expiration}</dd>
      </div>
    </dl>
  );
}
