import { ApiClientError } from "@/shared/api/client";

const messages: Record<string, string> = {
  STUDENT_INVITE_NOT_FOUND: "Приглашение не найдено. Проверьте ссылку.",
  STUDENT_INVITE_EXPIRED: "Срок действия приглашения истёк. Попросите преподавателя создать новое.",
  STUDENT_INVITE_REVOKED: "Приглашение отозвано преподавателем.",
  STUDENT_INVITE_ALREADY_ACCEPTED: "Приглашение уже было принято.",
  STUDENT_INVITE_EMAIL_CONFLICT:
    "Аккаунт с этим email уже существует. Обратитесь к преподавателю.",
};

export function getStudentInviteErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return messages[error.body.code] ?? error.body.message;
  }

  return "Не удалось загрузить приглашение. Попробуйте ещё раз.";
}
