"use client";

import { useRef, useState } from "react";
import type { WebFiles } from "@/shared/lib/web-exercise";
import { stepInsertion, type TypingStep } from "../model/exercises";
import styles from "./typing-input.module.css";

export function TypingInput({
  files,
  step,
  value,
  paused,
  onChange,
  onPause,
  onResume,
}: Readonly<{
  files: WebFiles;
  step: TypingStep;
  value: string;
  paused: boolean;
  onChange: (value: string) => void;
  onPause: () => void;
  onResume: () => void;
}>) {
  const composing = useRef(false);
  const compositionCommit = useRef<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const insertion = stepInsertion(files, step);
  const lineStart = insertion.before.lastIndexOf("\n") + 1;
  const prefix = insertion.before.slice(lineStart);
  const displayed = draft ?? value;

  function cancelComposition() {
    composing.current = false;
    compositionCommit.current = null;
    setDraft(null);
    onPause();
  }

  return (
    <div>
      <label htmlFor="typing-fragment" className="mb-3 block text-sm font-medium">
        Наберите фрагмент по серому образцу
      </label>
      <p id="typing-help" className="mb-4 text-sm text-foreground-muted">
        Вводите по порядку. Исправляйте ошибку клавишей Backspace. Enter — новая строка, отступы — пробелами. Tab и
        Shift+Tab переводят фокус между элементами. Вставка отключена. При уходе из поля таймер на паузе.
      </p>
      <p id="typing-sample" className="sr-only">
        Образец текущего шага: {step.text}
      </p>
      <div className={`${styles.code} rounded-control border border-border bg-surface-subtle p-4`}>
        <pre className={`${styles.source} text-foreground`} aria-label="Код до активного фрагмента, только чтение">
          {insertion.before.slice(0, lineStart)}
        </pre>
        <div className={styles.field}>
          <pre className={styles.ghost} style={{ paddingLeft: `${prefix.length}ch` }} aria-hidden="true">
            {Array.from(displayed).map((character, index) => {
              const incorrect = character !== step.text[index];
              return (
                <span
                  key={index}
                  className={
                    incorrect
                      ? `${styles.error} ${/\s/.test(character) ? styles.incorrectWhitespace : ""}`
                      : "text-foreground"
                  }
                >
                  {incorrect && character === " " ? "·" : incorrect && character === "\n" ? "↵\n" : character}
                </span>
              );
            })}
            <span className="text-foreground-muted opacity-60">{step.text.slice(displayed.length)}</span>
            {"\u200b"}
          </pre>
          <textarea
            id="typing-fragment"
            className={styles.input}
            style={{ paddingLeft: `${prefix.length}ch` }}
            value={displayed}
            readOnly={paused}
            aria-describedby="typing-help typing-sample typing-input-message"
            aria-invalid={!step.text.startsWith(value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            wrap="soft"
            onFocus={onResume}
            onBlur={cancelComposition}
            onSelect={(event) => {
              const field = event.currentTarget;
              if (
                !composing.current &&
                (field.selectionStart !== field.value.length || field.selectionEnd !== field.value.length)
              )
                field.setSelectionRange(field.value.length, field.value.length);
            }}
            onPaste={(event) => {
              event.preventDefault();
              setMessage("Вставка отключена: наберите код вручную, чтобы измерить скорость.");
            }}
            onDrop={(event) => {
              event.preventDefault();
              setMessage("Перетаскивание текста отключено: наберите код вручную.");
            }}
            onCompositionStart={() => {
              composing.current = true;
              compositionCommit.current = null;
              setDraft(value);
            }}
            onCompositionEnd={(event) => {
              if (!composing.current) return;
              composing.current = false;
              compositionCommit.current = event.currentTarget.value;
              setDraft(null);
              onChange(event.currentTarget.value);
            }}
            onChange={(event) => {
              setMessage("");
              if (compositionCommit.current === event.currentTarget.value) {
                compositionCommit.current = null;
                return;
              }
              compositionCommit.current = null;
              if (composing.current) setDraft(event.currentTarget.value);
              else onChange(event.currentTarget.value);
            }}
          />
        </div>
        <pre
          className={`${styles.source} text-foreground-muted`}
          aria-label="Код после активного фрагмента, только чтение"
        >
          {insertion.after.replace(/^\n/, "")}
        </pre>
      </div>
      <p id="typing-input-message" role="status" className="mt-3 min-h-5 text-sm text-foreground-muted">
        {message}
      </p>
    </div>
  );
}
