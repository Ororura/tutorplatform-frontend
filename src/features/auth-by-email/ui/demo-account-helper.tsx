import { Button } from "@/shared/ui/button";

export type DemoCredentials = { email: string; password: string };

const demoAccounts: ReadonlyArray<DemoCredentials & { label: string }> = [
  { label: "Demo Teacher", email: "teacher.demo@tutor.local", password: "DemoTeacher123!" },
  { label: "Demo Student Alex", email: "alex.demo@tutor.local", password: "DemoStudent123!" },
  { label: "Demo Student Maria", email: "maria.demo@tutor.local", password: "DemoStudent123!" },
];

export function isDemoMode(nodeEnv = process.env.NODE_ENV, enabled = process.env.NEXT_PUBLIC_DEMO_MODE): boolean {
  return nodeEnv !== "production" && enabled === "true";
}

export function DemoAccountHelper({ onSelect }: Readonly<{ onSelect: (credentials: DemoCredentials) => void }>) {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <fieldset className="space-y-2 rounded-md border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium text-neutral-700">Demo accounts</legend>
      <div className="grid gap-2">
        {demoAccounts.map(({ label, email, password }) => (
          <Button
            key={email}
            className="h-auto justify-start bg-neutral-100 py-2 text-neutral-900 hover:bg-neutral-200"
            type="button"
            onClick={() => onSelect({ email, password })}
          >
            {label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
