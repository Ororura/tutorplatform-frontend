"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Files, FileCode2 } from "lucide-react";
import { CodeEditor } from "@/shared/ui/code-editor";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/form-controls";
import { WebPreview } from "@/shared/ui/web-preview";
import { webFileNames, type WebFile, type WebFiles } from "@/shared/lib/web-exercise";
import { projectPreviewFiles, type PracticeTask } from "../model/tasks";
import styles from "./exam-workspace.module.css";

const fileKeys = Object.keys(webFileNames) as WebFile[];
type Panel = "brief" | "preview" | "reference";

export function ExamWorkspace({ task, onNext }: Readonly<{ task: PracticeTask; onNext: () => void }>) {
  const [files, setFiles] = useState<WebFiles>(() => ({ ...task.starter }));
  const [file, setFile] = useState<WebFile>(task.editableFiles[0]);
  const [panel, setPanel] = useState<Panel>("brief");
  const [version, setVersion] = useState(0);
  const [checked, setChecked] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const tabs = useId();
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((performance.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function run() {
    setVersion((current) => current + 1);
    setPanel("preview");
  }

  return (
    <section aria-label="Рабочая область вёрстки" data-task-id={task.id} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold wrap-anywhere">
            {task.title}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">{task.brief}</p>
        </div>
        <p className="text-sm text-foreground-muted tabular-nums" aria-label="Время работы">
          Время: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={run}>
          Запустить · Ctrl/⌘+Enter
        </Button>
        <Button type="button" variant="secondary" onClick={() => setResetOpen(true)}>
          Сбросить файлы
        </Button>
        <p className="text-xs text-foreground-muted">
          Изменения остаются в этой попытке до перехода к следующему заданию.
        </p>
      </div>
      {resetOpen && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-control border border-warning-border bg-warning-subtle p-3"
          role="group"
          aria-label="Сброс файлов"
        >
          <p className="text-sm">Удалить набранный код и вернуть исходные файлы?</p>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setFiles({ ...task.starter });
              setChecked([]);
              setVersion((current) => current + 1);
              setResetOpen(false);
            }}
          >
            Вернуть исходные файлы
          </Button>
          <Button type="button" variant="secondary" onClick={() => setResetOpen(false)}>
            Отмена
          </Button>
        </div>
      )}
      <div className={styles.workbench}>
        <div
          className={styles.workspace}
          onKeyDownCapture={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              run();
            }
          }}
        >
          <div className={styles.titlebar}>WEB PRACTICE — {task.title}</div>
          <div className={styles.panels}>
            <div className={styles.activity} aria-hidden="true">
              <Files size={22} />
            </div>
            <nav className={styles.explorer} aria-label="Проводник файлов">
              <p className="mb-3 text-xs tracking-wide">ПРОВОДНИК</p>
              <p className="mb-2 font-semibold">▾ WEB-PAGE</p>
              {fileKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={styles.file}
                  aria-current={file === key ? "true" : undefined}
                  onClick={() => setFile(key)}
                >
                  <FileCode2 size={15} aria-hidden="true" />
                  {webFileNames[key]}
                </button>
              ))}
            </nav>
            <div className={styles.editor}>
              <div className={styles.tabs} role="tablist" aria-label="Файлы проекта">
                {fileKeys.map((key, index) => (
                  <button
                    key={key}
                    type="button"
                    id={`${tabs}-tab-${key}`}
                    role="tab"
                    aria-selected={file === key}
                    aria-controls={`${tabs}-file-${key}`}
                    tabIndex={file === key ? 0 : -1}
                    className={styles.tab}
                    onClick={() => setFile(key)}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight"
                          ? (index + 1) % fileKeys.length
                          : event.key === "ArrowLeft"
                            ? (index + fileKeys.length - 1) % fileKeys.length
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? fileKeys.length - 1
                                : null;
                      if (next !== null) {
                        event.preventDefault();
                        setFile(fileKeys[next]);
                        document.getElementById(`${tabs}-tab-${fileKeys[next]}`)?.focus();
                      }
                    }}
                  >
                    {webFileNames[key]}
                    {task.editableFiles.includes(key) ? "" : " · 🔒"}
                  </button>
                ))}
              </div>
              <p className={styles.breadcrumb}>
                web-page › {webFileNames[file]}
                {task.editableFiles.includes(file) ? "" : " · только чтение"}
              </p>
              {/* Keep each editor mounted to preserve undo and cursor state when switching files. */}
              {fileKeys.map((key) => (
                <div
                  key={key}
                  id={`${tabs}-file-${key}`}
                  role="tabpanel"
                  aria-labelledby={`${tabs}-tab-${key}`}
                  hidden={key !== file}
                >
                  <CodeEditor
                    appearance="workspace"
                    label={`Код файла ${webFileNames[key]}`}
                    language={key}
                    value={files[key]}
                    disabled={!task.editableFiles.includes(key)}
                    onChange={(value) => {
                      if (task.editableFiles.includes(key)) {
                        setFiles((current) => ({ ...current, [key]: value }));
                        setChecked([]);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.statusbar}>
            <span>{file.toUpperCase()} · UTF-8 · Пробелы: 2</span>
            <span>
              Строк: {files[file].split("\n").length} · Символов: {files[file].length}
            </span>
          </div>
        </div>
        <aside className="surface min-w-0 space-y-4" aria-label="Условие и результат">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Панель задания">
            {(
              [
                ["brief", "Условие"],
                ["preview", "Результат"],
                ["reference", "Образец"],
              ] as const
            ).map(([key, name]) => (
              <Button
                key={key}
                type="button"
                variant={panel === key ? "primary" : "secondary"}
                aria-pressed={panel === key}
                onClick={() => setPanel(key)}
              >
                {name}
              </Button>
            ))}
          </div>
          <div hidden={panel !== "brief"}>
            <h3 className="font-semibold">Самопроверка по условию</h3>
            <p className="mt-2 text-sm text-foreground-muted">
              Сравните страницу с образцом, проверьте поведение и отметьте выполненные пункты. Это ваша оценка,
              автоматическая проверка не проводится.
            </p>
            <ul className="mt-4 space-y-3">
              {task.requirements.map((requirement, index) => (
                <li key={requirement}>
                  <label className="flex items-start gap-3 text-sm leading-6">
                    <Input
                      type="checkbox"
                      className="mt-1 shrink-0"
                      checked={checked.includes(index)}
                      onChange={(event) =>
                        setChecked((current) =>
                          event.target.checked ? [...current, index] : current.filter((value) => value !== index),
                        )
                      }
                    />
                    {requirement}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div hidden={panel !== "preview"}>
            <p className="mb-3 text-sm text-foreground-muted">
              Показывается последний запуск. После правок запустите страницу снова.
            </p>
            <WebPreview key={version} files={projectPreviewFiles(files)} />
          </div>
          <div hidden={panel !== "reference"}>
            <p className="mb-3 text-sm text-foreground-muted">
              Образец внешнего вида и поведения. Проверьте также ширину 375px и работу с клавиатуры.
            </p>
            <WebPreview files={projectPreviewFiles(task.solution)} />
          </div>
          <p className="text-xs text-foreground-muted">
            Tab — отступ в коде. Ctrl+M (⌃⇧M на Mac) переключает выход из редактора по Tab. Ctrl/⌘+Enter — запуск.
            Автодополнение, поиск и отмена доступны в редакторе.
          </p>
          <Button type="button" disabled={checked.length !== task.requirements.length} onClick={onNext}>
            Я проверил — следующее задание
          </Button>
        </aside>
      </div>
    </section>
  );
}
