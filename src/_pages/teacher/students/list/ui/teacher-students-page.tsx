import { Suspense } from "react";

import { TeacherStudentsContent } from "./teacher-students-content";

export function TeacherStudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="surface text-sm text-foreground-muted" aria-busy="true">
          Загружаем страницу…
        </div>
      }
    >
      <TeacherStudentsContent />
    </Suspense>
  );
}
