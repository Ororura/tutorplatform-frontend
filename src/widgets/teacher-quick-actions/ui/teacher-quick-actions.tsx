import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { CreateLearningProgramDialog } from "@/features/program/create";
import { CreateStudentDialog } from "@/features/student/create";
import { CreateTaskDialog } from "@/features/task/create";

export function TeacherQuickActions() {
  return (
    <Card className="xl:sticky xl:top-24">
      <CardHeader className="p-5">
        <CardTitle>Быстрые действия</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col items-stretch gap-2">
          <CreateStudentDialog />
          <CreateLearningProgramDialog triggerVariant="secondary" />
          <CreateTaskDialog triggerVariant="secondary" />
        </div>
      </CardContent>
    </Card>
  );
}
