import { describe, expect, it } from "vitest";
import { parseWebFiles, parseWebManifest, webSource } from "./web-exercise";
import templates from "@/entities/task/model/web-exercise-templates.json";

describe("web exercise manifests", () => {
  it("contains 15 usable templates and keeps submission files separate from teacher policy", () => {
    expect(templates).toHaveLength(15);
    expect(new Set(templates.map((item) => item.id)).size).toBe(15);
    for (const template of templates) {
      const manifest = parseWebManifest(JSON.stringify(template.starter));
      expect(manifest).not.toBeNull();
      expect(manifest?.criteria).toHaveLength(template.checks.length);
      expect(Object.keys(JSON.parse(webSource(manifest!))).sort()).toEqual(["css", "html", "javascript"]);
      expect(template.checks.every((check) => check.label && check.script)).toBe(true);
    }
  });
  it("rejects malformed files, unknown file names and invalid modes", () => {
    expect(parseWebFiles("null")).toBeNull();
    expect(parseWebFiles('{"html":1,"css":"","javascript":""}')).toBeNull();
    const base = templates[0].starter;
    for (const override of [{ editableFiles: [] }, { editableFiles: ["toString"] }, { reviewMode: "toString" }]) {
      expect(parseWebManifest(JSON.stringify({ ...base, ...override }))).toBeNull();
    }
  });
});
