export type ContentPackagePromptConfig = {
  subject: string;
  moduleTitle: string;
  level: "Начинающий" | "Средний" | "Продвинутый";
  topicCount: number;
  audience?: string;
  wishes?: string;
  theory: boolean;
  codeExamples: boolean;
  links: boolean;
};

export function generateContentPackagePrompt(config: ContentPackagePromptConfig): string {
  const subject = config.subject.trim();
  const moduleTitle = config.moduleTitle.trim();
  if (!subject || !moduleTitle) throw new Error("Укажите предмет и название модуля.");
  if (!Number.isInteger(config.topicCount) || config.topicCount < 1 || config.topicCount > 25)
    throw new Error("Количество тем должно быть целым числом от 1 до 25.");
  if (!config.theory && !config.codeExamples && !config.links)
    throw new Error("Выберите хотя бы один тип содержимого.");

  const selectedTypes = [
    config.theory && "теория (TEXT или MARKDOWN)",
    config.codeExamples && "примеры кода (CODE_EXAMPLE)",
    config.links && "дополнительные ссылки (LINK)",
  ].filter(Boolean);
  const materials = [
    config.theory &&
      `          - title: "Теория"
            materialType: MARKDOWN
            content: |
              Объясните ключевую идею темы и покажите, как её применить.`,
    config.codeExamples &&
      `          - title: "Пример кода"
            materialType: CODE_EXAMPLE
            content: |
              print("Пример")`,
    config.links &&
      `          - title: "Дополнительный материал"
            materialType: LINK
            externalUrl: "https://example.org/lesson"`,
  ].filter(Boolean);

  return `Создай учебный пакет Tutor Content Package v1 для импорта в приложение.

Параметры:
- Предмет: ${JSON.stringify(subject)}
- Название модуля: ${JSON.stringify(moduleTitle)}
- Уровень: ${config.level}
- Количество тем: ${config.topicCount}
- Целевая аудитория: ${JSON.stringify(config.audience?.trim() || "не указана")}
- Дополнительные пожелания: ${JSON.stringify(config.wishes?.trim() || "нет")}
- Типы содержимого: ${selectedTypes.join(", ")}.

Требования к результату:
1. Верни только валидный YAML в UTF-8: без Markdown code fence вокруг ответа и без пояснений вне YAML.
2. В корне укажи ровно schemaVersion: 1, kind: modules и modules. Создай один модуль с указанным названием. Количество тем в topics: ${config.topicCount}. Расположи темы от простого к сложному.
3. Структура: modules — список модулей; у модуля title, необязательное description и topics; у темы title, необязательное description и materials; у материала title, materialType и соответствующее поле содержимого.
4. Используй только типы материалов TEXT, MARKDOWN, CODE_EXAMPLE и LINK. Для TEXT, MARKDOWN и CODE_EXAMPLE используй content, а для LINK — только externalUrl с абсолютным HTTP(S) URL. Не добавляй content у LINK и externalUrl у других типов.
5. Добавляй материалы только выбранных типов: ${selectedTypes.join(", ")}. Если выбрана теория, сделай её содержательной: объяснение, детали и практический пример, а не одно предложение. Если выбраны ссылки, укажи настоящие релевантные URL; не выдумывай источники.
6. Не используй IMAGE и FILE. Не добавляй UUID, slug, position, tasks, homework и любые другие неизвестные поля.
7. Не используй YAML anchors, aliases и custom tags. Экранируй строки YAML при необходимости; для многострочного текста используй блок content: |.
8. Ограничения пакета: не больше 15 модулей, 25 тем на модуль и 250 материалов всего. Итоговый YAML-файл в UTF-8 должен быть не больше 1 МиБ (1 048 576 байт). Заголовки модулей и тем — не длиннее 180 символов, материалов — не длиннее 200 символов.

Минимальный полноценный пример структуры Tutor Content Package v1 (замени его содержимое по параметрам выше):
schemaVersion: 1
kind: modules
modules:
  - title: "Название модуля"
    description: "Краткое описание модуля"
    topics:
      - title: "Название темы"
        description: "Краткое описание темы"
        materials:
${materials.join("\n")}
`;
}
