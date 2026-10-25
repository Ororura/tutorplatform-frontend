"use client";

import {
  parseWebManifest,
  webFileNames,
  webReviewModes,
  type WebFile,
  type WebReviewMode,
} from "@/shared/lib/web-exercise";
import { Input, Select } from "@/shared/ui/form-controls";
import { WebFilesEditor } from "@/shared/ui/web-files-editor";

export function WebExerciseConfig({ value, onChange }: Readonly<{ value: string; onChange: (value: string) => void }>) {
  const manifest = parseWebManifest(value);
  if (!manifest) return <p role="alert">Выберите шаблон веб-упражнения.</p>;
  const update = (changes: Partial<typeof manifest>) => onChange(JSON.stringify({ ...manifest, ...changes }));
  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="field-label">Режим проверки</span>
        <Select
          aria-label="Режим проверки"
          value={manifest.reviewMode}
          onChange={(event) => update({ reviewMode: event.target.value as WebReviewMode })}
        >
          {Object.entries(webReviewModes).map(([mode, label]) => (
            <option key={mode} value={mode}>
              {label}
            </option>
          ))}
        </Select>
      </label>
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-2 text-sm font-medium">Ученик может редактировать</legend>
        {(Object.keys(webFileNames) as WebFile[]).map((file) => (
          <label key={file} className="flex items-center gap-2 text-sm">
            <Input
              type="checkbox"
              checked={manifest.editableFiles.includes(file)}
              disabled={manifest.editableFiles.length === 1 && manifest.editableFiles.includes(file)}
              onChange={(event) =>
                update({
                  editableFiles: event.target.checked
                    ? [...manifest.editableFiles, file]
                    : manifest.editableFiles.filter((value) => value !== file),
                })
              }
            />
            {webFileNames[file]}
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-foreground-muted">
        Стартовые файлы. Преподаватель может изменить любой файл; ограничения выше действуют для ученика.
      </p>
      <WebFilesEditor
        files={manifest}
        editableFiles={["html", "css", "javascript"]}
        onChange={(files) => update(files)}
      />
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {manifest.criteria?.map((label, index) => (
          <li key={index}>{label}</li>
        ))}
      </ul>
    </div>
  );
}
