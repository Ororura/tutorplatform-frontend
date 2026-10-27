import { describe, expect, it } from "vitest";
import { attemptStatistics, createAttempt, elapsedMs, pauseAttempt, resumeAttempt, updateInput } from "./attempt";
import { completedFiles, stepInsertion, typingExercises, type TypingExercise } from "./exercises";

const exercise: TypingExercise = {
  id: "test",
  title: "Test",
  language: "CSS",
  description: "Test",
  initial: { html: "<p>Hello</p>", css: "p {\n}\n", javascript: "" },
  steps: [
    { hint: "Red", text: "color: red;", file: "css", before: "}", prefix: "  ", suffix: "\n" },
    { hint: "Padding", text: "padding: 8px;", file: "css", before: "}", prefix: "  ", suffix: "\n" },
  ],
};

describe("typing attempt", () => {
  it("starts on the first character, keeps an error visible and requires its correction", () => {
    let attempt = createAttempt();
    expect(elapsedMs(attempt, 5000)).toBe(0);
    attempt = updateInput(exercise, attempt, "c", 5000);
    attempt = updateInput(exercise, attempt, "cx", 6000);
    expect(attempt.value).toBe("cx");
    expect(updateInput(exercise, attempt, "cxo", 6500)).toBe(attempt);
    attempt = updateInput(exercise, attempt, "c", 7000);
    attempt = updateInput(exercise, attempt, "co", 8000);
    expect(attempt).toMatchObject({ value: "co", inputs: 3, correctInputs: 2, completedSteps: 0 });
    expect(attemptStatistics(exercise, attempt, 8000)).toMatchObject({
      speed: 40,
      accuracy: 66.7,
      errors: 1,
      time: 3000,
    });
  });

  it("only commits exact fragments, automatically advances and never executes the active or future sample", () => {
    let attempt = updateInput(exercise, createAttempt(), "color", 0);
    expect(completedFiles(exercise, attempt.completedSteps)).toEqual(exercise.initial);
    attempt = updateInput(exercise, attempt, "color: red;", 1000);
    expect(attempt).toMatchObject({ value: "", completedSteps: 1, status: "running" });
    const files = completedFiles(exercise, attempt.completedSteps);
    expect(files.css).toBe("p {\n  color: red;\n}\n");
    expect(files.css).not.toContain("padding");
    expect(files.javascript).toBe("");
    expect(stepInsertion(files, exercise.steps[1])).toEqual({ before: "p {\n  color: red;\n  ", after: "\n}\n" });
  });

  it("excludes pauses, preserves errors and freezes the final statistics", () => {
    let attempt = updateInput(exercise, createAttempt(), "x", 1000);
    attempt = updateInput(exercise, attempt, "", 1200);
    attempt = updateInput(exercise, attempt, "color: red;", 2000);
    attempt = pauseAttempt(attempt, 3000);
    expect(elapsedMs(attempt, 20000)).toBe(2000);
    expect(updateInput(exercise, attempt, "p", 20000)).toBe(attempt);
    attempt = resumeAttempt(attempt, 20000);
    attempt = updateInput(exercise, attempt, "padding: 8px;", 22000);
    expect(attempt).toMatchObject({ status: "completed", completedSteps: 2, activeSince: null });
    const stats = attemptStatistics(exercise, attempt, 22000);
    expect(stats).toEqual({ time: 4000, speed: 360, accuracy: 96, errors: 1, correctCharacters: 24 });
    expect(attemptStatistics(exercise, attempt, 90000)).toEqual(stats);
    expect(updateInput(exercise, attempt, "extra", 90000)).toBe(attempt);
    expect(pauseAttempt(attempt, 90000)).toBe(attempt);
    expect(resumeAttempt(attempt, 90000)).toBe(attempt);
  });

  it("does not inflate speed by deleting and retyping correct characters", () => {
    let attempt = updateInput(exercise, createAttempt(), "co", 0);
    attempt = updateInput(exercise, attempt, "c", 1000);
    attempt = updateInput(exercise, attempt, "co", 2000);
    expect(attemptStatistics(exercise, attempt, 2000)).toMatchObject({
      correctCharacters: 2,
      speed: 60,
      accuracy: 100,
    });
    expect(attempt.inputs).toBe(3);
  });

  it("resets input, completed steps, counters and timer on repeat", () => {
    const previous = updateInput(exercise, createAttempt(), "color: red;", 1000);
    const repeated = createAttempt();
    expect(previous.completedSteps).toBe(1);
    expect(repeated).toMatchObject({
      value: "",
      completedSteps: 0,
      inputs: 0,
      correctInputs: 0,
      activeMs: 0,
      activeSince: null,
      status: "ready",
    });
    expect(completedFiles(exercise, repeated.completedSteps)).toEqual(exercise.initial);
  });

  it.each(typingExercises)("builds every step of $id at its declared insertion point", (item) => {
    let attempt = createAttempt();
    item.steps.forEach((step, index) => {
      const previous = completedFiles(item, index);
      const insertion = stepInsertion(previous, step);
      attempt = updateInput(item, attempt, step.text, index * 1000);
      const next = completedFiles(item, attempt.completedSteps);
      expect(next[step.file]).toBe(insertion.before + step.text + insertion.after);
      expect(attempt.completedSteps).toBe(index + 1);
    });
    expect(attempt.status).toBe("completed");
  });
});
