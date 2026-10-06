import { ChevronRight, GraduationCap, UserRound } from "lucide-react";

import { useDemoMode } from "@/shared/config";

export type DemoCredentials = { email: string; password: string };

const demoAccounts: ReadonlyArray<DemoCredentials & { label: string }> = [
  { label: "Demo Teacher", email: "teacher.demo@tutor.local", password: "DemoTeacher123!" },
  { label: "Demo Student Alex", email: "alex.demo@tutor.local", password: "DemoStudent123!" },
  { label: "Demo Student Maria", email: "maria.demo@tutor.local", password: "DemoStudent123!" },
];

export function DemoAccountHelper({ onSelect }: Readonly<{ onSelect: (credentials: DemoCredentials) => void }>) {
  if (!useDemoMode()) {
    return null;
  }

  return (
    <fieldset className="space-y-3 pt-1">
      <legend className="sr-only">Демонстрационные аккаунты</legend>
      <div
        className="flex items-center gap-4 text-xs font-medium tracking-wide text-foreground-muted"
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-surface-hover" />
        <span>Demo accounts</span>
        <span className="h-px flex-1 bg-surface-hover" />
      </div>
      <div className="grid gap-2.5">
        {demoAccounts.map(({ label, email, password }, index) => {
          const isTeacher = index === 0;
          const Icon = isTeacher ? GraduationCap : UserRound;
          const tone = isTeacher
            ? "bg-success-subtle text-success hover:bg-success-subtle/80 focus-visible:ring-focus-ring"
            : index === 1
              ? "bg-primary-subtle text-primary hover:bg-primary-subtle/80 focus-visible:ring-focus-ring"
              : "bg-primary-subtle text-primary hover:bg-primary-subtle/80 focus-visible:ring-focus-ring";

          return (
            <button
              key={email}
              className={`group flex min-h-12 w-full items-center gap-3 rounded-surface px-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 ${tone}`}
              type="button"
              onClick={() => onSelect({ email, password })}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface/75">
                <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="flex-1 text-foreground">{label}</span>
              <ChevronRight
                className="size-4.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
