import type { ContentPackagePreviewError, ContentPackagePreviewResponse } from "./content-package";

const fields: Record<string, string> = {
  root: "файл",
  schemaVersion: "версия схемы",
  kind: "тип пакета",
  modules: "список модулей",
  topics: "список уроков",
  materials: "список материалов",
  title: "название",
  materialType: "тип материала",
  content: "содержимое",
  externalUrl: "ссылка",
  description: "описание",
  file: "файл",
};

const moduleOrdinals = [
  "первого",
  "второго",
  "третьего",
  "четвёртого",
  "пятого",
  "шестого",
  "седьмого",
  "восьмого",
  "девятого",
  "десятого",
  "одиннадцатого",
  "двенадцатого",
  "тринадцатого",
  "четырнадцатого",
  "пятнадцатого",
  "шестнадцатого",
  "семнадцатого",
  "восемнадцатого",
  "девятнадцатого",
  "двадцатого",
  "двадцать первого",
  "двадцать второго",
  "двадцать третьего",
  "двадцать четвёртого",
  "двадцать пятого",
];
const topicOrdinals = [
  "первом",
  "втором",
  "третьем",
  "четвёртом",
  "пятом",
  "шестом",
  "седьмом",
  "восьмом",
  "девятом",
  "десятом",
];

function location(
  path: string | undefined,
  preview?: ContentPackagePreviewResponse,
): { context: string; field: string } {
  if (!path) return { context: "", field: "" };
  const match =
    /^modules(?:\[(\d+)\])?(?:\.topics(?:\[(\d+)\])?)?(?:\.materials(?:\[(\d+)\])?)?(?:\.([a-zA-Z]+))?$/.exec(path);
  if (!match) return { context: "", field: fields[path] ?? `поле ${path}` };

  const [, moduleNumber, topicNumber, materialNumber, fieldName] = match;
  const moduleIndex = moduleNumber === undefined ? undefined : Number(moduleNumber);
  const topicIndex = topicNumber === undefined ? undefined : Number(topicNumber);
  const materialIndex = materialNumber === undefined ? undefined : Number(materialNumber);
  const previewModule = moduleIndex === undefined ? undefined : preview?.modules?.[moduleIndex];
  const topic = topicIndex === undefined ? undefined : previewModule?.topics?.[topicIndex];
  const material = materialIndex === undefined ? undefined : topic?.materials?.[materialIndex];
  let context = "";
  if (moduleIndex !== undefined)
    context = previewModule?.title ? `в модуле «${previewModule.title}»` : `в модуле №${moduleIndex + 1}`;
  if (topicIndex !== undefined) {
    const lesson = topic?.title
      ? `в уроке «${topic.title}»`
      : topicIndex < topicOrdinals.length
        ? `${topicIndex === 1 || topicIndex === 7 ? "во" : "в"} ${topicOrdinals[topicIndex]} уроке`
        : `в уроке №${topicIndex + 1}`;
    const moduleName =
      moduleIndex === undefined
        ? ""
        : previewModule?.title
          ? ` модуля «${previewModule.title}»`
          : ` ${moduleOrdinals[moduleIndex] ? `${moduleOrdinals[moduleIndex]} модуля` : `модуля №${moduleIndex + 1}`}`;
    context = `${lesson}${moduleName}`;
  }
  if (materialIndex !== undefined)
    context += `${context ? ", " : ""}${material?.title ? `в материале «${material.title}»` : `в материале №${materialIndex + 1}`}`;
  const collection =
    materialNumber !== undefined
      ? "materials"
      : topicNumber !== undefined
        ? "topics"
        : moduleNumber !== undefined
          ? "modules"
          : "modules";
  return { context, field: fields[fieldName ?? collection] ?? `поле ${fieldName ?? collection}` };
}

function friendlyError(error: ContentPackagePreviewError, preview?: ContentPackagePreviewResponse): string {
  const { context, field } = location(error.path, preview);
  const place = context ? `${context}, ` : "";
  const subject = field || "поле";
  switch (error.code) {
    case "REQUIRED_FIELD":
      return `${place}отсутствует ${subject}.`;
    case "INVALID_MATERIAL_TYPE":
      return `${place}указан неподдерживаемый тип материала. Выберите тип из шаблона.`;
    case "INVALID_EXTERNAL_URL":
      return `${place}ссылка должна быть полным адресом HTTP или HTTPS.`;
    case "LIMIT_EXCEEDED":
      if (error.message?.includes("at most 250 materials"))
        return "В файле слишком много материалов. Оставьте не более 250 материалов.";
      if (error.message?.includes("at most 15 modules"))
        return "В файле слишком много модулей. Оставьте не более 15 модулей.";
      if (error.message?.includes("at most 25 topics"))
        return `${place}слишком много уроков. Оставьте не более 25 уроков в модуле.`;
      const titleLimit = /^Title exceeds (\d+) characters$/.exec(error.message ?? "");
      if (titleLimit) return `${place}название слишком длинное. Сократите его до ${titleLimit[1]} символов.`;
      return `${place}превышен допустимый лимит для ${subject}.`;
    case "UNKNOWN_FIELD":
      return `${place}поле ${error.path || "без пути"} не предусмотрено форматом файла.`;
    case "DUPLICATE_KEY":
      return `${place}поле ${error.path || "без пути"} указано повторно.`;
    case "UNSUPPORTED_SCHEMA_VERSION":
      return "Указана неподдерживаемая версия схемы. Используйте schemaVersion: 1.";
    case "INVALID_PACKAGE_KIND":
      return "Указан неподдерживаемый тип пакета. Используйте kind: modules.";
    case "INVALID_UTF8":
      return "Не удалось прочитать файл: сохраните его в кодировке UTF-8.";
    case "INVALID_YAML":
      return "Не удалось разобрать YAML-файл. Проверьте синтаксис и структуру документа.";
    case "FILE_TOO_LARGE":
      return "Файл слишком большой. Максимальный размер — 1 МиБ.";
    default:
      return `Не удалось проверить ${subject}${context ? ` ${context}` : ""}. Проверьте технические подробности.`;
  }
}

export function formatContentPackageError(
  error: ContentPackagePreviewError,
  preview?: ContentPackagePreviewResponse,
): string {
  const message = friendlyError(error, preview);
  return !preview && error.path && error.path !== "root" ? `${message} Путь: ${error.path}` : message;
}

export function serializeContentPackageErrors(errors: ContentPackagePreviewError[]): string {
  return errors
    .map((error) => `code: ${error.code ?? ""}\npath: ${error.path ?? ""}\nmessage: ${error.message ?? ""}`)
    .join("\n\n");
}
