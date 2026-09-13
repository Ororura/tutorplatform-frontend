import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/shared/api/client";

import { getStudentInviteErrorMessage } from "./student-invite-error";

function apiError(code: string) {
  return new ApiClientError(410, {
    code,
    message: "Backend message",
    timestamp: "2026-09-07T10:00:00Z",
    traceId: "trace",
    details: [],
  });
}

describe("getStudentInviteErrorMessage", () => {
  it.each([
    ["STUDENT_INVITE_NOT_FOUND", "Приглашение не найдено. Проверьте ссылку."],
    ["STUDENT_INVITE_EXPIRED", "Срок действия приглашения истёк. Попросите преподавателя создать новое."],
    ["STUDENT_INVITE_REVOKED", "Приглашение отозвано преподавателем."],
    ["STUDENT_INVITE_ALREADY_ACCEPTED", "Приглашение уже было принято."],
    ["STUDENT_INVITE_EMAIL_CONFLICT", "Аккаунт с этим email уже существует. Обратитесь к преподавателю."],
  ])("maps %s", (code, expected) => {
    expect(getStudentInviteErrorMessage(apiError(code))).toBe(expected);
  });
});
