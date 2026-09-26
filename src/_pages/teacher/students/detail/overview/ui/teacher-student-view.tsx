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
      <main className="mx-auto max-w-[1280px] space-y-4">
        <StudentDetailQueryState
          isPending={student.isPending}
          isError={student.isError}
          error={student.error}
          onRetry={() => student.refetch()}
        />

        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
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
    <main className="mx-auto max-w-[1280px] space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-7">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          href="/teacher/students"
        >
          <ArrowLeft size={16} />
          Все ученики
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 text-lg font-semibold text-blue-700 ring-1 ring-blue-100">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600">Профиль ученика</p>

              <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight text-slate-950">
                {student.data.firstName} {student.data.lastName ?? ""}
              </h1>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {getStudentStatusLabel(student.data.status)}
                </span>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
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

          <section
            className="rounded-2xl border border-[var(--border)] bg-white p-6"
            aria-labelledby="invite-history-heading"
          >
            <div>
              <p className="text-sm font-medium text-blue-600">Доступ</p>

              <h2 id="invite-history-heading" className="mt-1 text-xl font-semibold text-slate-950">
                История приглашений
              </h2>
            </div>

            <div className="mt-5">
              {invites.isPending && (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500" aria-busy="true">
                  Загружаем приглашения…
                </p>
              )}

              {invites.isError && (
                <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-5" role="alert">
                  <p className="text-sm text-red-700">Не удалось загрузить приглашения.</p>

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
                <p className="mt-4 text-sm text-red-700" role="alert">
                  Не удалось отозвать приглашение.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              {student.data.account.status === "REGISTERED" ? <ShieldCheck size={20} /> : <UserRound size={20} />}
            </span>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">Доступ ученика</h2>

            {student.data.account.status === "REGISTERED" ? (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Аккаунт ученика зарегистрирован и связан с профилем.
                </p>

                {student.data.account.email && (
                  <p className="mt-4 break-all rounded-2xl bg-white/80 p-3 text-sm font-medium text-slate-700">
                    {student.data.account.email}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Отправьте приглашение, чтобы ученик смог войти в свой кабинет.
                </p>

                <div className="mt-5">
                  <CreateStudentInviteDialog studentId={studentId} available={canCreateInvite} />
                </div>

                {hasActiveInvite && (
                  <p className="mt-4 rounded-2xl bg-white/80 p-3 text-sm text-slate-600">
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
