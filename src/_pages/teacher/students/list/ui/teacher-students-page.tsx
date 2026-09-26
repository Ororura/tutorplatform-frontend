import { Suspense } from "react";

import { TeacherStudentsContent } from "./teacher-students-content";

export function TeacherStudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-slate-500" aria-busy="true">
          Загружаем страницу…
        </div>
      }
    >
      <TeacherStudentsContent />
    </Suspense>
  );
}
