import type { components } from "@/shared/api/generated/schema";

type SubmissionStatus = components["schemas"]["StudentSubmissionResponse"]["status"];
type ExecutionStatus = components["schemas"]["ExecutionStatus"] | components["schemas"]["CodeSubmissionExecutionResponse"]["status"];

export const submissionStatusPresentation: Record<SubmissionStatus, string> = {
  SUBMITTED: "Отправлено",
  PASSED: "Выполнено",
  FAILED: "Не принято",
  NEEDS_REVIEW: "Ожидает проверки",
  SYSTEM_ERROR: "Ошибка проверки",
};

export const executionStatusPresentation: Record<ExecutionStatus, string> = {
  PENDING: "Ожидает запуска",
  RUNNING: "Выполняется",
  PASSED: "Все тесты пройдены",
  FAILED: "Есть непройденные тесты",
  TIMEOUT: "Превышено время выполнения",
  RUNTIME_ERROR: "Ошибка выполнения",
  SYSTEM_ERROR: "Не удалось выполнить код",
};
