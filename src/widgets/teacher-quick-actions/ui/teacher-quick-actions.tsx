import { CreateLearningProgramDialog } from "@/features/program/create";
import { CreateStudentDialog } from "@/features/student/create";
import { CreateTaskDialog } from "@/features/task/create";

export function TeacherQuickActions() {
  return (
    <section className="py-2 xl:sticky xl:top-28">
      <h2 className="text-lg font-semibold tracking-tight text-slate-950">Быстрые действия</h2>

      <div className="mt-3 flex flex-col items-stretch gap-2">
        <CreateStudentDialog />
        <CreateLearningProgramDialog triggerVariant="secondary" />
        <CreateTaskDialog triggerVariant="secondary" />
      </div>
    </section>
  );
}
