export const webFileNames = { html: "index.html", css: "styles.css", javascript: "script.js" } as const;
export type WebFile = keyof typeof webFileNames;
export type WebFiles = Record<WebFile, string>;
export type WebReviewMode = "AUTO" | "MANUAL" | "HYBRID";
export type WebManifest = WebFiles & {
  editableFiles: WebFile[];
  reviewMode: WebReviewMode;
  hint?: string;
  criteria?: string[];
};
export const webReviewModes: Record<WebReviewMode, string> = {
  AUTO: "Автоматическая проверка",
  MANUAL: "Проверка преподавателем",
  HYBRID: "Автотесты и проверка преподавателем",
};
export function parseWebFiles(value: string | null | undefined): WebFiles | null {
  try {
    const input: unknown = JSON.parse(value ?? "");
    if (!input || typeof input !== "object") return null;
    const files = input as Record<string, unknown>;
    if (typeof files.html !== "string" || typeof files.css !== "string" || typeof files.javascript !== "string")
      return null;
    return { html: files.html, css: files.css, javascript: files.javascript };
  } catch {
    return null;
  }
}
export function parseWebManifest(value: string | null | undefined): WebManifest | null {
  const files = parseWebFiles(value);
  if (!files) return null;
  const input = JSON.parse(value!) as Record<string, unknown>;
  if (
    !Array.isArray(input.editableFiles) ||
    !input.editableFiles.length ||
    !input.editableFiles.every((file) => typeof file === "string" && Object.hasOwn(webFileNames, file))
  )
    return null;
  if (input.reviewMode !== undefined && !Object.hasOwn(webReviewModes, String(input.reviewMode))) return null;
  return {
    ...files,
    editableFiles: input.editableFiles as WebFile[],
    reviewMode: (input.reviewMode ?? "AUTO") as WebReviewMode,
    hint: typeof input.hint === "string" ? input.hint : undefined,
    criteria: Array.isArray(input.criteria) ? input.criteria.filter((v): v is string => typeof v === "string") : [],
  };
}
export function webSource(files: WebFiles): string {
  return JSON.stringify({ html: files.html, css: files.css, javascript: files.javascript });
}
