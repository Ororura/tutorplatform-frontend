import { describe, expect, it } from "vitest";

import { generateContentPackagePrompt, type ContentPackagePromptConfig } from "./generate-content-package-prompt";

const config: ContentPackagePromptConfig = {
  subject: "Python",
  moduleTitle: "Условные операторы",
  level: "Средний",
  topicCount: 3,
  audience: "Школьники 12–16 лет",
  wishes: "Больше жизненных примеров",
  theory: true,
  codeExamples: true,
  links: true,
};

describe("generateContentPackagePrompt", () => {
  it("includes the requested parameters and a self-contained YAML example", () => {
    const prompt = generateContentPackagePrompt(config);
    expect(prompt).toContain('Предмет: "Python"');
    expect(prompt).toContain('Название модуля: "Условные операторы"');
    expect(prompt).toContain("Уровень: Средний");
    expect(prompt).toContain("Количество тем: 3");
    expect(prompt).toContain("Количество тем в topics: 3");
    expect(prompt).toContain('Целевая аудитория: "Школьники 12–16 лет"');
    expect(prompt).toContain('Дополнительные пожелания: "Больше жизненных примеров"');
    expect(prompt).toContain("Верни только валидный YAML");
    expect(prompt).toContain("без Markdown code fence");
    expect(prompt).toContain("без пояснений вне YAML");
    expect(prompt).toContain("от простого к сложному");
    expect(prompt).not.toMatch(/приложенн(?:ый|ого|ому) (?:шаблон|файл)|прикрепи файл/i);

    const example = prompt.slice(prompt.lastIndexOf("schemaVersion: 1\nkind: modules\nmodules:"));
    expect(example).toContain('  - title: "Название модуля"');
    expect(example).toContain("    topics:");
    expect(example).toContain("        materials:");
    expect(example).toContain("materialType: MARKDOWN\n            content: |");
    expect(example).toContain("materialType: CODE_EXAMPLE\n            content: |");
    expect(example).toContain('materialType: LINK\n            externalUrl: "https://example.org/lesson"');
    expect(example).not.toMatch(/^\s*(?:uuid|slug|position|tasks|homework):/m);
    expect(example).not.toMatch(/materialType: (?:IMAGE|FILE)/);
    expect(prompt).toContain("YAML anchors, aliases и custom tags");
    expect(prompt).toContain("1 МиБ (1 048 576 байт)");
  });

  it("only demonstrates selected content types", () => {
    const prompt = generateContentPackagePrompt({ ...config, theory: false, codeExamples: false });
    const example = prompt.slice(prompt.lastIndexOf("schemaVersion: 1\nkind: modules\nmodules:"));
    expect(example).toContain("materialType: LINK");
    expect(example).not.toContain("materialType: MARKDOWN");
    expect(example).not.toContain("materialType: CODE_EXAMPLE");
  });

  it.each([
    [true, false, false, ["MARKDOWN"]],
    [false, true, false, ["CODE_EXAMPLE"]],
    [false, false, true, ["LINK"]],
    [true, true, false, ["MARKDOWN", "CODE_EXAMPLE"]],
    [true, false, true, ["MARKDOWN", "LINK"]],
    [false, true, true, ["CODE_EXAMPLE", "LINK"]],
  ])("keeps the YAML example within the v1 contract for selected types %#", (theory, codeExamples, links, types) => {
    const prompt = generateContentPackagePrompt({ ...config, theory, codeExamples, links });
    const example = prompt.slice(prompt.lastIndexOf("schemaVersion: 1\nkind: modules\nmodules:"));
    expect([...example.matchAll(/materialType: (\w+)/g)].map((match) => match[1])).toEqual(types);
    expect(example).not.toMatch(/^\s*(?:type|body|url|uuid|slug|position|tasks|homework):/m);
    expect(example).not.toMatch(/materialType: (?:IMAGE|FILE)/);
    expect(prompt).toContain("Для TEXT, MARKDOWN и CODE_EXAMPLE используй content");
    expect(prompt).toContain("для LINK — только externalUrl");
  });

  it.each([
    [{ ...config, subject: " " }, "Укажите предмет"],
    [{ ...config, moduleTitle: " " }, "Укажите предмет"],
    [{ ...config, topicCount: 0 }, "от 1 до 25"],
    [{ ...config, topicCount: 26 }, "от 1 до 25"],
    [{ ...config, topicCount: 1.5 }, "от 1 до 25"],
    [{ ...config, theory: false, codeExamples: false, links: false }, "хотя бы один тип"],
  ])("rejects invalid configuration %#", (invalid, message) => {
    expect(() => generateContentPackagePrompt(invalid)).toThrow(message);
  });
});
