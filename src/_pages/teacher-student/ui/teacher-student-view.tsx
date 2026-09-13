"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { studentInviteQueries, StudentInviteHistory } from "@/entities/student-invite";
import { studentQueries, StudentDetailsCard } from "@/entities/student";
import { CreateStudentInviteDialog } from "@/features/create-student-invite";
import { EditStudentForm } from "@/features/edit-student";
import { useRevokeStudentInviteMutation } from "@/features/revoke-student-invite";
import { Button } from "@/shared/ui/button";

import { StudentDetailQueryState } from "./student-detail-query-state";

export function TeacherStudentView({ studentId }: Readonly<{ studentId: string }>) {
  const [editing, setEditing] = useState(false);
  const student = useQuery(studentQueries.detail(studentId));
  const invites = useQuery({
    ...studentInviteQueries.list(studentId),
    enabled: student.isSuccess,
  });
  const revokeInvite = useRevokeStudentInviteMutation(studentId);

  if (student.isPending || student.isError) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-6 py-12">
        <StudentDetailQueryState
          isPending={student.isPending}
          isError={student.isError}
          error={student.error}
          onRetry={() => student.refetch()}
        />
        <p><Link className="underline underline-offset-4" href="/teacher/students">Вернуться к списку</Link></p>
      </main>
    );
  }

  const hasActiveInvite = invites.data?.items.some((invite) => invite.status === "ACTIVE") ?? false;
  const canCreateInvite = student.data.account.status !== "REGISTERED" && invites.isSuccess && !hasActiveInvite;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <div>
        <Link className="text-sm text-neutral-600 underline underline-offset-4" href="/teacher/students">← Все ученики</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold">{student.data.firstName} {student.data.lastName ?? ""}</h1>
          <Button type="button" onClick={() => setEditing((value) => !value)}>{editing ? "Закрыть редактирование" : "Редактировать"}</Button>
        </div>
      </div>

      {editing ? <EditStudentForm student={student.data} onDone={() => setEditing(false)} /> : <StudentDetailsCard student={student.data} />}

      <nav className="border-b border-neutral-200" aria-label="Разделы ученика">
        <span className="inline-block border-b-2 border-neutral-900 px-1 pb-3 text-sm font-medium" aria-current="page">Обзор</span>
      </nav>

      {student.data.account.status !== "REGISTERED" && (
        <CreateStudentInviteDialog studentId={studentId} available={canCreateInvite} />
      )}
      {student.data.account.status !== "REGISTERED" && hasActiveInvite && (
        <p className="text-sm text-neutral-600">У ученика уже есть активное приглашение.</p>
      )}

      <section className="space-y-4" aria-labelledby="invite-history-heading">
        <h2 id="invite-history-heading" className="text-xl font-semibold">История приглашений</h2>
        {invites.isPending && <p aria-busy="true">Загружаем приглашения…</p>}
        {invites.isError && (
          <div className="space-y-3" role="alert">
            <p className="text-red-700">Не удалось загрузить приглашения.</p>
            <Button type="button" onClick={() => invites.refetch()}>Повторить</Button>
          </div>
        )}
        {invites.data && (
          <StudentInviteHistory
            invites={invites.data.items}
            revokingInviteId={revokeInvite.isPending ? revokeInvite.variables : undefined}
            onRevoke={(inviteId) => {
              if (window.confirm("Отозвать это приглашение?")) {
                revokeInvite.mutate(inviteId);
              }
            }}
          />
        )}
        {revokeInvite.isError && <p className="text-sm text-red-700" role="alert">Не удалось отозвать приглашение.</p>}
      </section>
    </main>
  );
}
