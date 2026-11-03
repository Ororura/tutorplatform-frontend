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
import { TeacherSubmissionInbox } from "@/widgets/teacher-submission-inbox/teacher-submission-inbox";
import { PageHeader } from "@/shared/ui/page-header";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Button } from "@/shared/ui/button";

import { StudentDetailQueryState } from "./student-detail-query-state";

export function TeacherStudentView({
  studentId,
}: Readonly<{
  studentId: string;
}>) {
  const [editing, setEditing] = useState(false);
  const [revokingId, setRevokingId] = useState<string>();

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

        <PageHeader
          className="mt-4"
          eyebrow="Профиль ученика"
          title={`${student.data.firstName} ${student.data.lastName ?? ""}`}
          description={
            <span className="flex flex-wrap gap-2">
              <Badge tone={student.data.status === "ACTIVE" ? "success" : "neutral"}>
                {getStudentStatusLabel(student.data.status)}
              </Badge>
              <Badge tone="info">{getStudentAccountStatusLabel(student.data.account.status)}</Badge>
            </span>
          }
          actions={
            <Button variant="secondary" onClick={() => setEditing((value) => !value)}>
              <Pencil size={16} aria-hidden="true" />
              {editing ? "Закрыть редактирование" : "Редактировать"}
            </Button>
          }
        />
      </section>

      <StudentProfileNav active="overview" studentId={studentId} />
      <TeacherSubmissionInbox studentId={studentId} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {editing ? (
            <EditStudentForm student={student.data} onDone={() => setEditing(false)} />
          ) : (
            <StudentDetailsCard student={student.data} />
          )}

          <Card aria-labelledby="invite-history-heading">
            <CardHeader className="border-b border-border p-5">
              <CardTitle id="invite-history-heading">История приглашений</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
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
                  onRevoke={setRevokingId}
                />
              )}

              {revokeInvite.isError && (
                <p className="mt-4 text-sm text-danger" role="alert">
                  Не удалось отозвать приглашение.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
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
          </Card>
        </aside>
        <ConfirmDialog
          open={Boolean(revokingId)}
          onOpenChange={(next) => {
            if (!next) setRevokingId(undefined);
          }}
          title="Отозвать приглашение?"
          description="Ученик больше не сможет зарегистрироваться по этой ссылке. Вы сможете создать новое приглашение."
          confirmLabel="Отозвать"
          pending={revokeInvite.isPending}
          error={revokeInvite.isError ? "Не удалось отозвать приглашение." : undefined}
          onConfirm={() => {
            if (revokingId) revokeInvite.mutate(revokingId, { onSuccess: () => setRevokingId(undefined) });
          }}
        />
      </div>
    </main>
  );
}
