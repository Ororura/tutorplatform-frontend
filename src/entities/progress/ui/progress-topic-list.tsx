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
  const iconClassName = variant === "completed" ? "text-success" : "text-primary";

  return (
    <section className="rounded-surface border border-border/80 bg-surface p-5">
      <h3 className="font-semibold text-foreground">{title}</h3>

      {topics?.length ? (
        <ul className="mt-4 space-y-2">
          {topics.map((topic, index) => (
            <li
              key={topic.id ?? `${variant}-${index}`}
              className="flex items-start gap-3 rounded-surface bg-surface-subtle px-3 py-2.5 text-sm text-foreground-muted"
            >
              <Icon size={17} className={`mt-0.5 shrink-0 ${iconClassName}`} aria-hidden="true" />
              <span>{topic.title ?? "Без названия"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-surface bg-surface-subtle px-3 py-4 text-sm text-foreground-muted">{emptyLabel}</p>
      )}
    </section>
  );
}
