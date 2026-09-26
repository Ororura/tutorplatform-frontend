import { Suspense } from "react";

import { TeacherTasksView } from "./teacher-tasks-view";

export function TeacherTasksPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-slate-500" aria-busy="true">
          Загружаем банк заданий…
        </div>
      }
    >
      <TeacherTasksView />
    </Suspense>
  );
}
