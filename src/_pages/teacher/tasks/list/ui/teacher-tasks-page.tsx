import { Suspense } from "react";

import { TeacherTasksView } from "./teacher-tasks-view";

export function TeacherTasksPage() {
  return (
    <Suspense
      fallback={
        <div
          className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          aria-busy="true"
        >
          Загружаем банк заданий…
        </div>
      }
    >
      <TeacherTasksView />
    </Suspense>
  );
}
