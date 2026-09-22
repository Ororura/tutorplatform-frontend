import type { TeacherAssessment } from "../api/assessment-queries";

const scoreLabels: ReadonlyArray<[keyof TeacherAssessment, string]> = [
  ["understandingScore", "Понимание материала"],
  ["independenceScore", "Самостоятельность"],
  ["practiceScore", "Практика"],
  ["homeworkScore", "Домашняя работа"],
];

export function AssessmentDetails({ assessment }: Readonly<{ assessment: TeacherAssessment }>) {
  return (
    <div className="space-y-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        {scoreLabels.map(([field, label]) => (
          <div className="rounded-lg bg-neutral-50 p-4" key={field}>
            <dt className="text-sm text-neutral-500">{label}</dt>
            <dd className="mt-1 text-lg font-semibold">
              {assessment[field] === null || assessment[field] === undefined
                ? "Не указано"
                : `${assessment[field]} из 5`}
            </dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="text-sm font-medium text-neutral-500">Комментарий для ученика</h3>
        <p className="mt-2 whitespace-pre-line text-neutral-700">{assessment.publicComment || "Не указан"}</p>
      </div>
    </div>
  );
}
