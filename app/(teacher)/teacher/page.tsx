import { LogoutButton } from "@/features/logout";

export default function TeacherWorkspacePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-500">Tutor Learning Platform</p>
          <h1 className="text-3xl font-semibold tracking-tight">Teacher Workspace</h1>
          <p className="text-neutral-600">Рабочие инструменты преподавателя появятся в следующих vertical slices.</p>
        </div>
        <LogoutButton />
      </div>
    </main>
  );
}
