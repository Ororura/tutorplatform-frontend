import { ApiClientError } from "@/shared/api/client";

const messages: Record<string, string> = {
  TEACHER_INVITATION_NOT_FOUND: "Приглашение не найдено. Проверьте ссылку.",

  TEACHER_INVITATION_NOT_ACTIVE: "Приглашение уже использовано, отозвано или просрочено.",

  EMAIL_ALREADY_REGISTERED: "Аккаунт с таким email уже существует.",

  CSRF_INVALID: "Не удалось подтвердить сессию. Попробуйте ещё раз.",
};

export function getTeacherInvitationErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return messages[error.body.code] ?? error.body.message ?? "Не удалось выполнить запрос.";
  }

  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}
