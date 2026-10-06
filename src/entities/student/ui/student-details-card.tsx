import { CalendarDays, Mail, UserRound, UserRoundCheck } from "lucide-react";

import type { StudentDetails } from "../api/student-queries";
import { getStudentAccountStatusLabel, getStudentStatusLabel } from "../lib/student-labels";

export function StudentDetailsCard({
  student,
}: Readonly<{
  student: StudentDetails;
}>) {
  const studentStatusClassName =
    student.status === "ACTIVE" ? "bg-success-subtle text-success" : "bg-surface-subtle text-foreground-muted";

  const accountStatusClassName =
    student.account.status === "REGISTERED"
      ? "bg-success-subtle text-success"
      : student.account.status === "INVITED"
        ? "bg-warning-subtle text-warning"
        : "bg-surface-subtle text-foreground-muted";

  return (
    <section className="surface">
      <div>
        <p className="text-sm font-medium text-primary">Карточка ученика</p>

        <h2 className="section-title mt-1">Основная информация</h2>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="border-b border-border pb-4 last:border-0">
          <dt className="flex items-center gap-2 text-sm text-foreground-muted">
            <UserRound size={16} />
            Имя
          </dt>

          <dd className="mt-2 font-semibold text-foreground">{student.firstName}</dd>
        </div>

        <div className="border-b border-border pb-4 last:border-0">
          <dt className="flex items-center gap-2 text-sm text-foreground-muted">
            <UserRound size={16} />
            Фамилия
          </dt>

          <dd className="mt-2 font-semibold text-foreground">{student.lastName ?? "Не указана"}</dd>
        </div>

        <div className="border-b border-border pb-4 last:border-0">
          <dt className="text-sm text-foreground-muted">Статус ученика</dt>

          <dd className="mt-2">
            <span className={`badge  ${studentStatusClassName}`}>{getStudentStatusLabel(student.status)}</span>
          </dd>
        </div>

        <div className="border-b border-border pb-4 last:border-0">
          <dt className="flex items-center gap-2 text-sm text-foreground-muted">
            <UserRoundCheck size={16} />
            Статус аккаунта
          </dt>

          <dd className="mt-2">
            <span className={`badge  ${accountStatusClassName}`}>
              {getStudentAccountStatusLabel(student.account.status)}
            </span>
          </dd>
        </div>

        <div className="border-b border-border pb-4 last:border-0">
          <dt className="flex items-center gap-2 text-sm text-foreground-muted">
            <Mail size={16} />
            Email аккаунта
          </dt>

          <dd className="mt-2 break-all font-medium text-foreground">{student.account.email ?? "Не указан"}</dd>
        </div>

        <div className="border-b border-border pb-4 last:border-0">
          <dt className="flex items-center gap-2 text-sm text-foreground-muted">
            <CalendarDays size={16} />
            Связь
          </dt>

          <dd className="mt-2 text-sm font-medium leading-6 text-foreground">
            Основной преподаватель с {new Date(student.relation.startedAt).toLocaleDateString("ru-RU")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
