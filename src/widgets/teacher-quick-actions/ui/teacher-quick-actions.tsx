import { CreateLearningProgramDialog } from "@/features/program/create";
import { CreateStudentDialog } from "@/features/student/create";
import { CreateTaskDialog } from "@/features/task/create";

export function TeacherQuickActions() {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6 xl:sticky xl:top-28 xl:self-start">
      <p className="text-sm font-medium text-blue-600">Создать</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Быстрые действия</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Начните основное действие, не покидая рабочее пространство.
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-3">
        <CreateStudentDialog />
        <CreateLearningProgramDialog />
        <CreateTaskDialog />
      </div>
    </section>
  );
}
