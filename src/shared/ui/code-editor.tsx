"use client";

import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import type { components } from "@/shared/api/generated/schema";

loader.config({ paths: { vs: "/monaco/vs" } });
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = Readonly<{
  language: components["schemas"]["ProgrammingLanguage"];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}>;

export function CodeEditor({ language, value, onChange, disabled }: Props) {
  return (
    <div className="overflow-hidden rounded-control border border-border" data-language={language.toLowerCase()}>
      <Editor
        beforeMount={() => {
          // The AMD entrypoint installs blob workers; replace its factory before creating the editor.
          (window as Window & { MonacoEnvironment?: { getWorker: () => Worker } }).MonacoEnvironment = {
            getWorker: () => new Worker("/monaco/editor.worker.js", { type: "module" }),
          };
        }}
        height="20rem"
        language={language === "JAVA" ? "java" : "python"}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        options={{
          ariaLabel: "Код решения",
          readOnly: disabled,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 4,
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
