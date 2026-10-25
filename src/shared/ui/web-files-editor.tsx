"use client";

import { useState, useId } from "react";
import { webFileNames, type WebFile, type WebFiles } from "@/shared/lib/web-exercise";
import { CodeEditor } from "@/shared/ui/code-editor";
import { WebPreview } from "@/shared/ui/web-preview";

export function WebFilesEditor({
  files,
  editableFiles,
  onChange,
  disabled = false,
}: Readonly<{
  files: WebFiles;
  editableFiles: WebFile[];
  onChange?: (files: WebFiles) => void;
  disabled?: boolean;
}>) {
  const panelId = useId();
  const [file, setFile] = useState<WebFile>(editableFiles[0] ?? "html");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Файлы упражнения">
        {(Object.keys(webFileNames) as WebFile[]).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={file === name}
            aria-controls={panelId}
            className={`rounded-control border px-3 py-2 text-sm ${file === name ? "border-primary font-medium" : "border-border"}`}
            onClick={() => setFile(name)}
          >
            {webFileNames[name]}
            {!editableFiles.includes(name) ? " · только чтение" : ""}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={panelId} aria-label={webFileNames[file]}>
        <CodeEditor
          key={file}
          language={file}
          value={files[file]}
          disabled={disabled || !editableFiles.includes(file)}
          onChange={(value) => {
            if (!disabled && editableFiles.includes(file)) onChange?.({ ...files, [file]: value });
          }}
        />
      </div>
      <WebPreview files={files} />
    </div>
  );
}
