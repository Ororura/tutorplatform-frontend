import type { StudentAccountStatus, StudentDetails } from "../api/student-queries";

type StudentStatus = StudentDetails["status"];

const accountStatusLabels: Record<StudentAccountStatus, string> = {
  UNREGISTERED: "Без аккаунта",
  INVITED: "Приглашён",
  REGISTERED: "Зарегистрирован",
};

const studentStatusLabels: Record<StudentStatus, string> = {
  ACTIVE: "Активен",
  INACTIVE: "Неактивен",
  ARCHIVED: "В архиве",
};

export function getStudentAccountStatusLabel(status: StudentAccountStatus): string {
  return accountStatusLabels[status];
}

export function getStudentStatusLabel(status: StudentStatus): string {
  return studentStatusLabels[status];
}
