import { CalendarDays, Mail, UserRound, UserRoundCheck } from "lucide-react";

import type { StudentDetails } from "../api/student-queries";
import { getStudentAccountStatusLabel, getStudentStatusLabel } from "../lib/student-labels";

export function StudentDetailsCard({
  student,
}: Readonly<{
  student: StudentDetails;
}>) {
  const studentStatusClassName =
    student.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";

  const accountStatusClassName =
    student.account.status === "REGISTERED"
      ? "bg-emerald-50 text-emerald-700"
      : student.account.status === "INVITED"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <div>
        <p className="text-sm font-medium text-blue-600">Карточка ученика</p>

        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Основная информация</h2>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-sm text-slate-500">
            <UserRound size={16} />
            Имя
          </dt>

          <dd className="mt-2 font-semibold text-slate-950">{student.firstName}</dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-sm text-slate-500">
            <UserRound size={16} />
            Фамилия
          </dt>

          <dd className="mt-2 font-semibold text-slate-950">{student.lastName ?? "Не указана"}</dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">Статус ученика</dt>

          <dd className="mt-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${studentStatusClassName}`}>
              {getStudentStatusLabel(student.status)}
            </span>
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-sm text-slate-500">
            <UserRoundCheck size={16} />
            Статус аккаунта
          </dt>

          <dd className="mt-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${accountStatusClassName}`}>
              {getStudentAccountStatusLabel(student.account.status)}
            </span>
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-sm text-slate-500">
            <Mail size={16} />
            Email аккаунта
          </dt>

          <dd className="mt-2 break-all font-medium text-slate-900">{student.account.email ?? "Не указан"}</dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} />
            Связь
          </dt>

          <dd className="mt-2 text-sm font-medium leading-6 text-slate-900">
            Основной преподаватель с {new Date(student.relation.startedAt).toLocaleDateString("ru-RU")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
