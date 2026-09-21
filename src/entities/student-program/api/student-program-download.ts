import { apiTransport } from "@/shared/api/client";

export function studentMaterialDownloadUrl(studentProgramId: string, topicId: string, materialId: string): string {
  return `/api/v1/student/programs/${encodeURIComponent(studentProgramId)}/topics/${encodeURIComponent(
    topicId,
  )}/materials/${encodeURIComponent(materialId)}/download`;
}

export async function downloadStudentProgramMaterial(url: string, fallbackFilename: string): Promise<void> {
  const response = await apiTransport(url, { method: "GET" });
  if (!response.ok) throw new Error(`Material download failed with status ${response.status}`);

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
