import type { LessonMaterial } from "../api/material-queries";
import { SafeMarkdown } from "./safe-markdown";

export type RenderableMaterial = Pick<
  LessonMaterial,
  "id" | "materialType" | "title" | "content" | "externalUrl" | "position"
> &
  Partial<Pick<LessonMaterial, "topicId">>;

function downloadUrl(material: RenderableMaterial): string | undefined {
  if (!material.topicId) return undefined;
  return `/api/v1/teacher/topics/${encodeURIComponent(material.topicId)}/materials/${encodeURIComponent(
    material.id,
  )}/download`;
}

function externalUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

type Props = {
  material: RenderableMaterial;
  getDownloadUrl?: (material: RenderableMaterial) => string | undefined;
  onDownload?: (material: RenderableMaterial, href: string) => void;
};

export function MaterialRenderer({ material, getDownloadUrl = downloadUrl, onDownload }: Readonly<Props>) {
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
    case "FILE": {
      const href = getDownloadUrl(material);
      return href ? (
        <a
          className="underline underline-offset-4"
          href={href}
          onClick={
            onDownload
              ? (event) => {
                  event.preventDefault();
                  onDownload(material, href);
                }
              : undefined
          }
        >
          Скачать файл
        </a>
      ) : (
        <p className="text-sm text-neutral-500">Файл пока недоступен для скачивания.</p>
      );
    }
    case "IMAGE": {
      const href = getDownloadUrl(material);
      return href ? (
        <a className="underline underline-offset-4" href={href} rel="noopener noreferrer" target="_blank">
          Открыть изображение
        </a>
      ) : (
        <p className="text-sm text-neutral-500">Изображение пока недоступно для просмотра.</p>
      );
    }
    default:
      return <p className="text-sm text-neutral-500">Этот тип материала пока не поддерживается.</p>;
  }
}
