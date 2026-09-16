import { LogoutButton } from "@/features/auth/logout";

export function StudentLandingPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-lg space-y-3 text-center">
        <p className="text-sm font-medium text-neutral-500">Tutor Learning Platform</p>
        <h1 className="text-3xl font-semibold tracking-tight">Student Workspace</h1>
        <p className="text-neutral-600">Учебный кабинет появится в одном из следующих этапов разработки.</p>
        <div className="pt-3">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
