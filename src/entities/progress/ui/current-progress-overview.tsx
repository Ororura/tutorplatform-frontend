import { BookCheck, CalendarCheck2, ClipboardCheck, Clock3, Dumbbell, GraduationCap } from "lucide-react";

import type { CurrentProgress } from "../api/progress-queries";
import {
  formatAssessmentAverage,
  formatAttendanceRate,
  formatCompletedMetric,
  formatLearningDuration,
  formatProgressValue,
} from "../model/progress-presentation";
import { ProgressMetricCard } from "./progress-metric-card";
import { ProgressTopicList } from "./progress-topic-list";

const assessmentItems = [
  ["Понимание", "understandingAverage"],
  ["Самостоятельность", "independenceAverage"],
  ["Практика", "practiceAverage"],
  ["Домашние задания", "homeworkAverage"],
] as const;

type Props = {
  progress: CurrentProgress;
  audience?: "student" | "teacher" | "parent";
};

export function CurrentProgressOverview({ progress, audience = "teacher" }: Readonly<Props>) {
  const isStudent = audience === "student";
  const isParent = audience === "parent";
  const completedTopicsCount = progress.topics?.completed?.length;

  return (
    <div className="space-y-5">
      <section aria-labelledby="progress-metrics-heading">
        <h2 id="progress-metrics-heading" className="text-xl font-semibold text-slate-950">
          {isStudent ? "Ваши результаты" : "Основные показатели"}
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ProgressMetricCard
            icon={Clock3}
            label={isStudent ? "Пройдено учебных часов" : "Время обучения"}
            value={
              isStudent || isParent
                ? formatLearningDuration(progress.totalLearningMinutes)
                : formatProgressValue(progress.totalLearningMinutes, " мин")
            }
          />
          <ProgressMetricCard
            icon={GraduationCap}
            label={isStudent ? "Пройденные занятия" : "Занятия"}
            value={formatProgressValue(progress.sessionsCount)}
          />
          <ProgressMetricCard
            icon={CalendarCheck2}
            label={isStudent ? "Посещаемость занятий" : "Посещаемость"}
            value={formatAttendanceRate(progress.attendanceRate)}
          />
          <ProgressMetricCard
            icon={ClipboardCheck}
            label={isStudent ? "Выполненные домашние задания" : "Домашние задания"}
            value={formatCompletedMetric(progress.homework?.completed, progress.homework?.assigned)}
            hint="Выполнено из назначенных"
          />
          <ProgressMetricCard
            icon={Dumbbell}
            label={isStudent ? "Выполненная практика" : "Практика"}
            value={formatCompletedMetric(progress.practice?.completed, progress.practice?.assigned)}
            hint="Выполнено из назначенных"
          />
          <ProgressMetricCard
            icon={BookCheck}
            label={isParent ? "Завершённые темы" : "Всего тем"}
            value={formatProgressValue(isParent ? completedTopicsCount : progress.totalTopics)}
          />
        </div>
      </section>

      <section aria-labelledby="topic-progress-heading">
        <h2 id="topic-progress-heading" className="text-xl font-semibold text-slate-950">
          Темы программы
        </h2>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <ProgressTopicList
            title="Завершённые темы"
            topics={progress.topics?.completed}
            emptyLabel="Завершённых тем пока нет."
            variant="completed"
          />
          <ProgressTopicList
            title="В процессе изучения"
            topics={progress.topics?.inProgress}
            emptyLabel="Сейчас нет тем в процессе изучения."
            variant="in-progress"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5" aria-labelledby="assessment-heading">
        <h2 id="assessment-heading" className="text-xl font-semibold text-slate-950">
          {isStudent || isParent ? "Оценки преподавателя" : "Средние оценки преподавателя"}
        </h2>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {assessmentItems.map(([label, field]) => (
            <div key={field} className="rounded-xl bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-950">
                {formatAssessmentAverage(progress.assessment?.[field])}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
