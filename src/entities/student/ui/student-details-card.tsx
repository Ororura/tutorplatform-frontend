import type { StudentDetails } from "../api/student-queries";
import { getStudentAccountStatusLabel, getStudentStatusLabel } from "../lib/student-labels";

export function StudentDetailsCard({ student }: Readonly<{ student: StudentDetails }>) {
  return (
    <dl className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-2">
      <div>
        <dt className="text-sm text-neutral-500">Имя</dt>
        <dd className="mt-1 font-medium">{student.firstName}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Фамилия</dt>
        <dd className="mt-1 font-medium">{student.lastName ?? "Не указана"}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Статус</dt>
        <dd className="mt-1">{getStudentStatusLabel(student.status)}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Статус аккаунта</dt>
        <dd className="mt-1">{getStudentAccountStatusLabel(student.account.status)}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Email аккаунта</dt>
        <dd className="mt-1">{student.account.email ?? "Не указан"}</dd>
      </div>
      <div>
        <dt className="text-sm text-neutral-500">Связь</dt>
        <dd className="mt-1">
          Основной преподаватель с {new Date(student.relation.startedAt).toLocaleDateString("ru-RU")}
        </dd>
      </div>
    </dl>
  );
}
