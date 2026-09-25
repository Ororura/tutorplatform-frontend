"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import {
  generateContentPackagePrompt,
  type ContentPackagePromptConfig,
} from "../model/generate-content-package-prompt";

type FormConfig = Omit<ContentPackagePromptConfig, "topicCount"> & { topicCount: string };

const initialConfig: FormConfig = {
  subject: "",
  moduleTitle: "",
  level: "Начинающий",
  topicCount: "5",
  audience: "",
  wishes: "",
  theory: true,
  codeExamples: false,
  links: false,
};

const fieldClass = "mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-950";

export function ContentPackagePromptDialog({ onClose }: Readonly<{ onClose: () => void }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [config, setConfig] = useState<FormConfig>(initialConfig);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const update = (change: Partial<FormConfig>) => {
    setConfig((current) => ({ ...current, ...change }));
    setPrompt(null);
    setError("");
    setCopyStatus("idle");
  };

  const preparePrompt = () => {
    try {
      const result = generateContentPackagePrompt({ ...config, topicCount: Number(config.topicCount) });
      setPrompt(result);
      setError("");
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось подготовить промпт.");
      return null;
    }
  };

  const copyPrompt = async () => {
    const value = prompt ?? preparePrompt();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
      setPrompt(value);
      requestAnimationFrame(() => promptRef.current?.select());
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="content-package-prompt-title"
      aria-describedby="content-package-prompt-description"
      className="m-auto max-h-[min(90vh,50rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-neutral-900/35"
      onClose={onClose}
    >
      <form
        className="space-y-4 p-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          preparePrompt();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="content-package-prompt-title" className="text-xl font-semibold text-slate-950">
            Подготовка учебных материалов с помощью ИИ
          </h2>
          <button type="button" className="text-sm underline" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <p id="content-package-prompt-description" className="text-sm leading-6 text-slate-600">
          Укажите параметры учебного модуля. Мы подготовим запрос, который можно отправить любой нейросети.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-950">
            Предмет
            <input
              className={fieldClass}
              value={config.subject}
              placeholder="Python"
              required
              onChange={(event) => update({ subject: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-950">
            Название модуля
            <input
              className={fieldClass}
              value={config.moduleTitle}
              placeholder="Условные операторы"
              required
              onChange={(event) => update({ moduleTitle: event.target.value })}
            />
          </label>
          <label className="text-sm font-medium text-slate-950">
            Уровень
            <select
              className={fieldClass}
              value={config.level}
              onChange={(event) => update({ level: event.target.value as ContentPackagePromptConfig["level"] })}
            >
              <option>Начинающий</option>
              <option>Средний</option>
              <option>Продвинутый</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-950">
            Количество тем
            <input
              className={fieldClass}
              type="number"
              min="1"
              max="25"
              step="1"
              value={config.topicCount}
              required
              onChange={(event) => update({ topicCount: event.target.value })}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-950">
          Целевая аудитория <span className="font-normal text-slate-500">(необязательно)</span>
          <input
            className={fieldClass}
            value={config.audience}
            placeholder="Школьники 12–16 лет"
            onChange={(event) => update({ audience: event.target.value })}
          />
        </label>
        <label className="block text-sm font-medium text-slate-950">
          Дополнительные пожелания <span className="font-normal text-slate-500">(необязательно)</span>
          <textarea
            className={fieldClass}
            rows={2}
            value={config.wishes}
            placeholder="Используй больше примеров из повседневной жизни"
            onChange={(event) => update({ wishes: event.target.value })}
          />
        </label>
        <fieldset className="space-y-2 text-sm text-slate-950">
          <legend className="font-medium">Тип содержимого</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.theory}
                onChange={(event) => update({ theory: event.target.checked })}
              />
              Теория
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.codeExamples}
                onChange={(event) => update({ codeExamples: event.target.checked })}
              />
              Примеры кода
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.links}
                onChange={(event) => update({ links: event.target.checked })}
              />
              Дополнительные ссылки
            </label>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {prompt !== null && (
          <label className="block text-sm font-medium text-slate-950">
            Готовый промпт
            <textarea ref={promptRef} className={`${fieldClass} min-h-48 font-mono`} value={prompt} readOnly />
          </label>
        )}
        {copyStatus === "copied" && (
          <p role="status" className="text-sm text-emerald-700">
            Промпт скопирован
          </p>
        )}
        {copyStatus === "failed" && (
          <p role="alert" className="text-sm text-red-700">
            Не удалось скопировать промпт. Выделите текст в поле выше и скопируйте его вручную.
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Вернуться к импорту
          </Button>
          <Button type="submit" variant="secondary">
            Показать промпт
          </Button>
          <Button type="button" onClick={() => void copyPrompt()}>
            Скопировать промпт
          </Button>
        </div>
      </form>
    </dialog>
  );
}
