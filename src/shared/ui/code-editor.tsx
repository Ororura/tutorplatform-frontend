"use client";

import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import type { components } from "@/shared/api/generated/schema";

loader.config({ paths: { vs: "/monaco/vs" } });
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = Readonly<{
  language: components["schemas"]["ProgrammingLanguage"] | "html" | "css" | "javascript";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  appearance?: "default" | "workspace";
  label?: string;
}>;

export function CodeEditor({
  language,
  value,
  onChange,
  disabled,
  appearance = "default",
  label = "Код решения",
}: Props) {
  return (
    <div className="overflow-hidden rounded-control border border-border" data-language={language.toLowerCase()}>
      <Editor
        beforeMount={() => {
          // The AMD entrypoint installs blob workers; replace its factory before creating the editor.
          (window as Window & { MonacoEnvironment?: { getWorker: () => Worker } }).MonacoEnvironment = {
            getWorker: () => new Worker("/monaco/editor.worker.js", { type: "module" }),
          };
        }}
        height={appearance === "workspace" ? "max(24rem, 58vh)" : "20rem"}
        theme={appearance === "workspace" ? "vs-dark" : "vs"}
        language={
          language === "JAVA" ? "java" : language === "PYTHON" ? "python" : language === "WEB" ? "javascript" : language
        }
        value={value}
        onChange={(next) => onChange(next ?? "")}
        options={{
          ariaLabel: label,
          readOnly: disabled,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: appearance === "workspace" ? 2 : 4,
          ...(appearance === "workspace"
            ? ({ insertSpaces: true, wordWrap: "on", padding: { top: 16, bottom: 16 }, lineNumbers: "on" } as const)
            : {}),
        }}
        loading={
          <p className="p-4 text-sm text-foreground-muted" aria-busy="true">
            Загружаем редактор…
          </p>
        }
      />
    </div>
  );
}
