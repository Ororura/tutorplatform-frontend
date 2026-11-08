import { describe, expect, it } from "vitest";
import { completedFiles } from "@/features/code-typing/model/exercises";
import { createPracticeTask, practiceTechnologies, projectPreviewFiles, type PracticeTechnology } from "./tasks";

describe("practice stream", () => {
  it("reproduces a variant and continues beyond the initial catalog without ending", () => {
    expect(createPracticeTask("css", 17, 8)).toEqual(createPracticeTask("css", 17, 8));
    const tasks = Array.from({ length: 200 }, (_, index) => createPracticeTask("css", 0, index));
    expect(new Set(tasks.map((task) => task.id)).size).toBe(200);
    expect(new Set(tasks.map((task) => task.solution.css)).size).toBeGreaterThan(30);
    expect(createPracticeTask("html", 39, 10000).title).toContain("вариант 10001");
  });

  it("keeps solutions out of editable starter files and keeps other technologies ready", () => {
    for (const technology of Object.keys(practiceTechnologies) as PracticeTechnology[]) {
      const task = createPracticeTask(technology, 0, 0);
      for (const file of ["html", "css", "javascript"] as const) {
        if (task.editableFiles.includes(file)) expect(task.starter[file]).not.toBe(task.solution[file]);
        else expect(task.starter[file]).toBe(task.solution[file]);
      }
      expect(task.starter.html).toContain('<script src="script.js" defer></script>');
      expect(task.starter.html).toContain('<link rel="stylesheet" href="styles.css">');
    }
  });

  it("rotates technologies in the combined typing stream", () => {
    expect([0, 1, 2, 3].map((position) => createPracticeTask("all", 6, position).typing.language)).toEqual([
      "HTML",
      "CSS",
      "JavaScript",
      "HTML",
    ]);
  });

  it.each(["html", "css", "javascript"] as const)(
    "builds complete %s typing variants from exactly the applied steps",
    (technology) => {
      for (let position = 0; position < 12; position++) {
        const { typing, solution } = createPracticeTask(technology, 0, position);
        expect(completedFiles(typing, 0)).toEqual(typing.initial);
        const first = completedFiles(typing, 1);
        expect(first[technology]).not.toContain(typing.steps[1].text);
        const final = completedFiles(typing, typing.steps.length);
        if (technology === "html") {
          expect(solution.html).toContain(final.html);
        } else expect(final[technology].trim()).toBe(solution[technology].trim());
      }
    },
  );

  it("adapts local project file connections for the existing isolated preview without editing source", () => {
    const task = createPracticeTask("all", 0, 0);
    const preview = projectPreviewFiles(task.solution);
    expect(preview.html).not.toMatch(/<link[^>]+href="styles.css"/);
    expect(preview.html).not.toMatch(/<script[^>]+src="script.js"/);
    expect(preview.css).toBe(task.solution.css);
    expect(preview.javascript).toBe(task.solution.javascript);
    expect(task.solution.html).toContain('<script src="script.js"');
    const other = '<script src="https://example.com/other.js"></script><p>Keep me</p>';
    expect(projectPreviewFiles({ html: other, css: "", javascript: "" }).html).toBe(other);
  });
});
