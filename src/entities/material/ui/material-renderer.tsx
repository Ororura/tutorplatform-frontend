import type { LessonMaterial } from "../api/material-queries";
import { SafeMarkdown } from "./safe-markdown";

function downloadUrl(material: LessonMaterial): string {
  return `/api/v1/teacher/topics/${encodeURIComponent(material.topicId)}/materials/${encodeURIComponent(
    material.id,
  )}/download`;
}

function externalUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function MaterialRenderer({ material }: Readonly<{ material: LessonMaterial }>) {
  switch (material.materialType) {
    case "TEXT":
      return <p className="whitespace-pre-wrap leading-7">{material.content ?? ""}</p>;
    case "MARKDOWN":
      return <SafeMarkdown>{material.content ?? ""}</SafeMarkdown>;
    case "CODE_EXAMPLE":
      return (
        <pre className="overflow-x-auto rounded-md bg-neutral-950 p-4 text-sm text-neutral-100">
          <code>{material.content ?? ""}</code>
        </pre>
      );
    case "LINK": {
      const href = externalUrl(material.externalUrl);
      return href ? (
        <a
          className="inline-flex rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
          href={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          Открыть материал
        </a>
      ) : (
        <p className="text-sm text-neutral-500">Ссылка на материал недоступна.</p>
      );
    }
    case "FILE":
      return (
        <a className="underline underline-offset-4" href={downloadUrl(material)}>
          Скачать файл
        </a>
      );
    case "IMAGE":
      return (
        <a className="underline underline-offset-4" href={downloadUrl(material)} target="_blank">
          Открыть изображение
        </a>
      );
    default:
      return <p className="text-sm text-neutral-500">Этот тип материала пока не поддерживается.</p>;
  }
}
