import type { TypingExercise } from "./exercises";

export type TypingAttempt = {
  value: string;
  completedSteps: number;
  inputs: number;
  correctInputs: number;
  activeMs: number;
  activeSince: number | null;
  status: "ready" | "running" | "paused" | "completed";
};

export function createAttempt(): TypingAttempt {
  return { value: "", completedSteps: 0, inputs: 0, correctInputs: 0, activeMs: 0, activeSince: null, status: "ready" };
}

export function elapsedMs(attempt: TypingAttempt, now: number) {
  return attempt.activeMs + (attempt.activeSince === null ? 0 : Math.max(0, now - attempt.activeSince));
}

export function pauseAttempt(attempt: TypingAttempt, now: number): TypingAttempt {
  if (attempt.status !== "running") return attempt;
  return { ...attempt, activeMs: elapsedMs(attempt, now), activeSince: null, status: "paused" };
}

export function resumeAttempt(attempt: TypingAttempt, now: number): TypingAttempt {
  return attempt.status === "paused" ? { ...attempt, activeSince: now, status: "running" } : attempt;
}

export function updateInput(
  exercise: TypingExercise,
  attempt: TypingAttempt,
  value: string,
  now: number,
): TypingAttempt {
  if (attempt.status === "completed" || attempt.status === "paused" || value === attempt.value) return attempt;
  if (attempt.value.startsWith(value)) return { ...attempt, value }; // Tail deletion never counts as input.
  const step = exercise.steps[attempt.completedSteps];
  // Sequential typing: fix the last error with Backspace before continuing.
  if (!value.startsWith(attempt.value) || !step.text.startsWith(attempt.value)) return attempt;

  let next: TypingAttempt = { ...attempt, status: "running", activeSince: attempt.activeSince ?? now };
  for (const character of value.slice(attempt.value.length)) {
    const correct = step.text.slice(next.value.length).startsWith(character);
    next = {
      ...next,
      value: next.value + character,
      inputs: next.inputs + 1,
      correctInputs: next.correctInputs + Number(correct),
    };
    if (!correct) break;
    if (next.value === step.text) {
      next = { ...next, value: "", completedSteps: next.completedSteps + 1 };
      if (next.completedSteps === exercise.steps.length) {
        next = { ...next, status: "completed", activeMs: elapsedMs(next, now), activeSince: null };
      }
      break; // A single input cannot spill into the next step.
    }
  }
  return next;
}

export function attemptStatistics(exercise: TypingExercise, attempt: TypingAttempt, now: number) {
  const target = exercise.steps[attempt.completedSteps]?.text ?? "";
  let currentCorrect = 0;
  for (const character of attempt.value) {
    if (!target.slice(currentCorrect).startsWith(character)) break;
    currentCorrect += character.length;
  }
  const correctCharacters =
    exercise.steps.slice(0, attempt.completedSteps).reduce((sum, step) => sum + step.text.length, 0) + currentCorrect;
  const time = elapsedMs(attempt, now);
  return {
    speed: time > 0 ? Math.round((correctCharacters * 60000) / time) : 0,
    accuracy: attempt.inputs ? Math.round((attempt.correctInputs / attempt.inputs) * 1000) / 10 : 100,
    time,
    errors: attempt.inputs - attempt.correctInputs,
    correctCharacters,
  };
}
