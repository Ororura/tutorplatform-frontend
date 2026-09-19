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
      <div className="flex items-center gap-4 text-xs font-medium tracking-wide text-slate-500" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span>Demo accounts</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid gap-2.5">
        {demoAccounts.map(({ label, email, password }, index) => {
          const isTeacher = index === 0;
          const Icon = isTeacher ? GraduationCap : UserRound;
          const tone = isTeacher
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 focus-visible:ring-emerald-100"
            : index === 1
              ? "bg-blue-50 text-blue-700 hover:bg-blue-100/80 focus-visible:ring-blue-100"
              : "bg-violet-50 text-violet-700 hover:bg-violet-100/80 focus-visible:ring-violet-100";

          return (
            <button
              key={email}
              className={`group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 ${tone}`}
              type="button"
              onClick={() => onSelect({ email, password })}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/75">
                <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="flex-1 text-slate-900">{label}</span>
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
