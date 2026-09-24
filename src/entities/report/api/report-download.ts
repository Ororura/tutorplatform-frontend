import { apiTransport, ApiClientError, type ApiErrorBody } from "@/shared/api/client";

export async function downloadTeacherReportPdf(reportId: string): Promise<void> {
  await downloadPdf(`/api/v1/teacher/reports/${encodeURIComponent(reportId)}/pdf`, "progress-report.pdf");
}

export async function downloadPublicReportPdf(token: string): Promise<void> {
  await downloadPdf(`/api/v1/public/reports/${encodeURIComponent(token)}/pdf`, "progress-report.pdf");
}

async function downloadPdf(url: string, fallbackFilename: string): Promise<void> {
  const response = await apiTransport(url, { method: "GET" });
  if (!response.ok) throw await responseError(response);

  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = responseFilename(response) ?? fallbackFilename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function responseError(response: Response): Promise<ApiClientError> {
  try {
    return new ApiClientError(response.status, (await response.json()) as ApiErrorBody);
  } catch {
    return new ApiClientError(response.status, {
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`,
      timestamp: new Date().toISOString(),
      traceId: response.headers.get("X-Trace-Id") ?? "",
      details: [],
    });
  }
}

function responseFilename(response: Response): string | undefined {
  const disposition = response.headers.get("Content-Disposition");
  if (!disposition) return undefined;

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return undefined;
    }
  }

  return disposition.match(/filename="([^"]+)"/i)?.[1];
}
