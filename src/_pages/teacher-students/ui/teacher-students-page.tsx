import { Suspense } from "react";

import { LogoutButton } from "@/features/logout";

import { TeacherStudentsContent } from "./teacher-students-content";

export function TeacherStudentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-start justify-between gap-6">
        <h1 className="text-3xl font-semibold">Ученики</h1>
        <LogoutButton />
      </div>
      <Suspense fallback={<p className="mt-8 text-neutral-600" aria-busy="true">Загружаем страницу…</p>}>
        <TeacherStudentsContent />
      </Suspense>
    </main>
  );
}
