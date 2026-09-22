import { CheckCircle2, CircleDot } from "lucide-react";

import type { ProgressTopic } from "../api/progress-queries";

export function ProgressTopicList({
  title,
  topics,
  emptyLabel,
  variant,
}: Readonly<{
  title: string;
  topics?: ProgressTopic[];
  emptyLabel: string;
  variant: "completed" | "in-progress";
}>) {
  const Icon = variant === "completed" ? CheckCircle2 : CircleDot;
  const iconClassName = variant === "completed" ? "text-emerald-600" : "text-blue-600";

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <h3 className="font-semibold text-slate-950">{title}</h3>

      {topics?.length ? (
        <ul className="mt-4 space-y-2">
          {topics.map((topic, index) => (
            <li
              key={topic.id ?? `${variant}-${index}`}
              className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
            >
              <Icon size={17} className={`mt-0.5 shrink-0 ${iconClassName}`} aria-hidden="true" />
              <span>{topic.title ?? "Без названия"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </section>
  );
}
