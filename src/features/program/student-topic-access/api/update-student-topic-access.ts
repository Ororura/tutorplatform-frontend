import { apiTransport, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

export type StudentTopicAccessStatus = "LOCKED" | "AVAILABLE";

export type UpdateStudentTopicAccessInput = {
  studentId: string;
  studentProgramId: string;
  status: StudentTopicAccessStatus;
  topicIds: string[];
};

export async function updateStudentTopicAccess({
  studentId,
  studentProgramId,
  status,
  topicIds,
}: UpdateStudentTopicAccessInput): Promise<void> {
  const response = await apiTransport(
    `/api/v1/teacher/students/${encodeURIComponent(studentId)}/programs/${encodeURIComponent(
      studentProgramId,
    )}/topics/access`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        topicIds,
      }),
    },
  );

  if (response.ok) {
    return;
  }

  let body: ApiErrorBody;

  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = {
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`,
      timestamp: new Date().toISOString(),
      traceId: response.headers.get("X-Trace-Id") ?? "",
      details: [],
    };
  }

  throw new ApiClientError(response.status, body);
}
