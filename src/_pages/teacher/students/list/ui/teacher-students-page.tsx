import { Suspense } from "react";

import { LogoutButton } from "@/features/auth/logout";
import Link from "next/link";

import { TeacherStudentsContent } from "./teacher-students-content";

export function TeacherStudentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-start justify-between gap-6">
        <h1 className="text-3xl font-semibold">Ученики</h1>
        <div className="flex items-center gap-3">
          <Link
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium"
            href="/teacher/tasks"
          >
            Банк заданий
          </Link>
          <LogoutButton />
        </div>
      </div>
      <Suspense
        fallback={
          <p className="mt-8 text-neutral-600" aria-busy="true">
            Загружаем страницу…
          </p>
        }
      >
        <TeacherStudentsContent />
      </Suspense>
    </main>
  );
}
