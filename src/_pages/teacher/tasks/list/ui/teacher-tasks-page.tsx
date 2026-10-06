import { Suspense } from "react";

import { TeacherTasksView } from "./teacher-tasks-view";

export function TeacherTasksPage() {
  return (
    <Suspense
      fallback={
        <div className="surface text-sm text-foreground-muted" aria-busy="true">
          Загружаем банк заданий…
        </div>
      }
    >
      <TeacherTasksView />
    </Suspense>
  );
}
