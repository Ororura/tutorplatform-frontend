"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenText, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { StudentDashboardHeader } from "./student-dashboard-header";
import { StudentHomeworkCard } from "./student-homework-card";
import { StudentProgramCard, StudentProgramMotivation } from "./student-program-card";
import { DashboardSection, DashboardSkeleton, DashboardError } from "./dashboard-primitives";

import { EmptyState } from "@/shared/ui/feedback";
import { studentHomeworkQueries } from "@/entities/homework";
import { studentProgramQueries } from "@/entities/student-program";

const previewSize = 3;

export function StudentLandingPage() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const programs = useQuery(studentProgramQueries.currentList());
  const homeworks = useQuery(
    studentHomeworkQueries.list({
      status: "ASSIGNED",
      page: 0,
      size: previewSize,
      sort: "dueAt,asc",
    }),
  );

  const priorityProgramId = homeworks.data?.items.find((item) => item.status === "ASSIGNED")?.studentProgramId;
  const visiblePrograms = [...(programs.data ?? [])]
    .sort(
      (a, b) =>
        Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") ||
        Number(b.id === priorityProgramId) - Number(a.id === priorityProgramId),
    )
    .slice(0, previewSize);

  return (
    <main className="page-stack">
      <StudentDashboardHeader
        now={now}
        attentionCount={homeworks.isError ? undefined : homeworks.data?.totalElements}
        nearest={
          homeworks.isError ? undefined : homeworks.data?.items.find((item) => item.status === "ASSIGNED" && item.dueAt)
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <DashboardSection
          title="Домашние задания"
          subtitle="Твои текущие и ближайшие задания"
          icon={ClipboardCheck}
          href="/student/homework"
          linkLabel="Все задания"
        >
          {homeworks.isPending && <DashboardSkeleton label="Загружаем домашние задания…" />}
          {homeworks.isError && (
            <DashboardError message="Не удалось загрузить домашние задания." retry={() => homeworks.refetch()} />
          )}
          {!homeworks.isError && homeworks.data?.items.length === 0 && (
            <EmptyState title="Невыполненных заданий нет" description="Новые задания преподавателя появятся здесь." />
          )}
          {!homeworks.isError &&
            homeworks.data?.items
              .filter((item) => item.status === "ASSIGNED")
              .slice(0, previewSize)
              .map((homework, index) => (
                <StudentHomeworkCard
                  key={homework.id}
                  homework={homework}
                  priority={index === 0}
                  now={now}
                  programTitle={programs.data?.find((program) => program.id === homework.studentProgramId)?.title}
                />
              ))}
        </DashboardSection>

        <DashboardSection title="Моя программа" icon={BookOpenText} href="/student/programs" linkLabel="Все программы">
          {programs.isPending && <DashboardSkeleton label="Загружаем программы…" />}
          {programs.isError && (
            <DashboardError message="Не удалось загрузить ваши программы." retry={() => programs.refetch()} />
          )}
          {!programs.isError && programs.data?.length === 0 && (
            <EmptyState title="Программ пока нет" description="Назначенные преподавателем программы появятся здесь." />
          )}
          {!programs.isError &&
            visiblePrograms.map((program, index) => (
              <StudentProgramCard key={program.id} program={program} primary={index === 0} />
            ))}
          {!programs.isError && visiblePrograms[0]?.status === "ACTIVE" && (
            <StudentProgramMotivation program={visiblePrograms[0]} />
          )}
        </DashboardSection>
      </div>
    </main>
  );
}
