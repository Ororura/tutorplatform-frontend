import { Suspense } from "react";

import { TeacherStudentsContent } from "./teacher-students-content";

export function TeacherStudentsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="rounded-[28px] border border-white/80 bg-white p-6 text-sm text-slate-500 shadow-[0_12px_40px_rgba(45,79,135,0.06)]"
          aria-busy="true"
        >
          Загружаем страницу…
        </div>
      }
    >
      <TeacherStudentsContent />
    </Suspense>
  );
}
