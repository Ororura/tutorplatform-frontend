import { describe, expect, it } from "vitest";

import { formatContentPackageError } from "./format-content-package-error";

describe("formatContentPackageError", () => {
  it.each([
    ["REQUIRED_FIELD", "modules[0].topics[1].materials[2].content", "отсутствует содержимое"],
    ["INVALID_MATERIAL_TYPE", "modules[0].topics[0].materials[0].materialType", "неподдерживаемый тип материала"],
    ["INVALID_EXTERNAL_URL", "modules[0].topics[0].materials[0].externalUrl", "полным адресом HTTP или HTTPS"],
    ["LIMIT_EXCEEDED", "modules[0].topics", "превышен допустимый лимит"],
    ["INVALID_YAML", "root", "Проверьте синтаксис"],
    ["UNKNOWN_FIELD", "modules[0].wrong", "не предусмотрено форматом"],
    ["DUPLICATE_KEY", "modules[0].title", "указано повторно"],
    ["UNSUPPORTED_SCHEMA_VERSION", "schemaVersion", "schemaVersion: 1"],
    ["INVALID_PACKAGE_KIND", "kind", "kind: modules"],
    ["INVALID_UTF8", "root", "UTF-8"],
    ["FILE_TOO_LARGE", "root", "1 МиБ"],
  ])("formats backend code %s", (code, path, expected) => {
    expect(formatContentPackageError({ code, path, message: "Backend message" })).toContain(expected);
  });

  it("uses names from preview context when available", () => {
    expect(
      formatContentPackageError(
        { code: "REQUIRED_FIELD", path: "modules[0].topics[0].materials[0].content", message: "Required" },
        { modules: [{ title: "Алгебра", topics: [{ title: "Дроби", materials: [{ title: "Объяснение" }] }] }] },
      ),
    ).toBe("в уроке «Дроби» модуля «Алгебра», в материале «Объяснение», отсутствует содержимое.");
  });
});
