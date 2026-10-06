"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  getStudentAccountStatusLabel,
  getStudentStatusLabel,
  StudentDetailsCard,
  StudentProfileNav,
  studentQueries,
} from "@/entities/student";
import { StudentInviteHistory, studentInviteQueries } from "@/entities/student-invite";
import { EditStudentForm } from "@/features/student/edit";
import { CreateStudentInviteDialog } from "@/features/student/invite/create";
import { useRevokeStudentInviteMutation } from "@/features/student/invite/revoke";
import { Button } from "@/shared/ui/button";

import { StudentDetailQueryState } from "./student-detail-query-state";

export function TeacherStudentView({
  studentId,
}: Readonly<{
  studentId: string;
}>) {
  const [editing, setEditing] = useState(false);

  const student = useQuery(studentQueries.detail(studentId));

  const invites = useQuery({
    ...studentInviteQueries.list(studentId),
    enabled: student.isSuccess,
  });

  const revokeInvite = useRevokeStudentInviteMutation(studentId);

  if (student.isPending || student.isError) {
    return (
      <main className="page-stack">
        <StudentDetailQueryState
          isPending={student.isPending}
          isError={student.isError}
          error={student.error}
          onRetry={() => student.refetch()}
        />

        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-primary"
          href="/teacher/students"
        >
          <ArrowLeft size={16} />
          Вернуться к списку
        </Link>
      </main>
    );
  }

  const hasActiveInvite = invites.data?.items.some((invite) => invite.status === "ACTIVE") ?? false;

  const canCreateInvite = student.data.account.status !== "REGISTERED" && invites.isSuccess && !hasActiveInvite;

  const initials = `${student.data.firstName[0] ?? ""}${student.data.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <main className="page-stack">
      <section className="pb-2">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted transition hover:text-primary"
          href="/teacher/students"
        >
          <ArrowLeft size={16} />
          Все ученики
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-lg font-semibold text-foreground-muted">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">Профиль ученика</p>

              <h1 className="page-title mt-1 wrap-break-word">
                {student.data.firstName} {student.data.lastName ?? ""}
              </h1>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge bg-success-subtle text-success">
                  {getStudentStatusLabel(student.data.status)}
                </span>

                <span className="badge bg-primary-subtle text-primary">
                  {getStudentAccountStatusLabel(student.data.account.status)}
                </span>
              </div>
            </div>
          </div>

          <Button type="button" variant="secondary" onClick={() => setEditing((value) => !value)}>
            <Pencil size={16} className="mr-2" />

            {editing ? "Закрыть редактирование" : "Редактировать"}
          </Button>
        </div>
      </section>

      <StudentProfileNav active="overview" studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {editing ? (
            <EditStudentForm student={student.data} onDone={() => setEditing(false)} />
          ) : (
            <StudentDetailsCard student={student.data} />
          )}

          <section className="surface" aria-labelledby="invite-history-heading">
            <div>
              <p className="text-sm font-medium text-primary">Доступ</p>

              <h2 id="invite-history-heading" className="section-title mt-1">
                История приглашений
              </h2>
            </div>

            <div className="mt-5">
              {invites.isPending && (
                <p className="rounded-surface bg-surface-subtle p-5 text-sm text-foreground-muted" aria-busy="true">
                  Загружаем приглашения…
                </p>
              )}

              {invites.isError && (
                <div
                  className="space-y-3 rounded-surface border border-danger-border bg-danger-subtle p-5"
                  role="alert"
                >
                  <p className="text-sm text-danger">Не удалось загрузить приглашения.</p>

                  <Button type="button" variant="secondary" onClick={() => invites.refetch()}>
                    Повторить
                  </Button>
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

              {revokeInvite.isError && (
                <p className="mt-4 text-sm text-danger" role="alert">
                  Не удалось отозвать приглашение.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-surface border border-primary-border bg-surface-subtle p-6">
            <span className="flex size-11 items-center justify-center rounded-surface bg-surface text-primary">
              {student.data.account.status === "REGISTERED" ? <ShieldCheck size={20} /> : <UserRound size={20} />}
            </span>

            <h2 className="section-title mt-5">Доступ ученика</h2>

            {student.data.account.status === "REGISTERED" ? (
              <>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Аккаунт ученика зарегистрирован и связан с профилем.
                </p>

                {student.data.account.email && (
                  <p className="mt-4 break-all rounded-surface bg-surface/80 p-3 text-sm font-medium text-foreground-muted">
                    {student.data.account.email}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  Отправьте приглашение, чтобы ученик смог войти в свой кабинет.
                </p>

                <div className="mt-5">
                  <CreateStudentInviteDialog studentId={studentId} available={canCreateInvite} />
                </div>

                {hasActiveInvite && (
                  <p className="mt-4 rounded-surface bg-surface/80 p-3 text-sm text-foreground-muted">
                    У ученика уже есть активное приглашение.
                  </p>
                )}
              </>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
