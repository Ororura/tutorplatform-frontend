import { Suspense } from "react";

import { TeacherTasksView } from "./teacher-tasks-view";

export function TeacherTasksPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-5xl px-6 py-12" aria-busy="true">
          Загружаем банк заданий…
        </p>
      }
    >
      <TeacherTasksView />
    </Suspense>
  );
}
