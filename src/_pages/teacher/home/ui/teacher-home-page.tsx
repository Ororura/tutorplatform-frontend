"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardQueries, type TeacherDashboard } from "@/entities/dashboard";
import { studentQueries } from "@/entities/student";
import { useCurrentUserQuery } from "@/entities/user";
import { PageHeader } from "@/shared/ui/page-header";
import { LoadingState, ErrorState } from "@/shared/ui/feedback";
import { TeacherAttention } from "@/widgets/teacher-attention";
import { TeacherDashboardStats } from "@/widgets/teacher-dashboard-stats";
import { TeacherQuickActions } from "@/widgets/teacher-quick-actions";
import { TeacherStudentsOverview } from "@/widgets/teacher-students-overview";

const studentListParams = {
  page: 0,
  size: 6,
  sort: "createdAt,desc",
} as const;

export function TeacherHomePage() {
  const currentUser = useCurrentUserQuery();
  const dashboard = useQuery(dashboardQueries.teacher());
  const students = useQuery(studentQueries.list(studentListParams));

  if (currentUser.isPending) {
    return <TeacherHomeLoading />;
  }

  if (currentUser.isError || !currentUser.data) {
    return (
      <TeacherHomeError
        onRetry={() => {
          void currentUser.refetch();
        }}
      />
    );
  }

  return (
    <main className="page-stack">
      <PageHeader
        eyebrow="Рабочее пространство"
        title={`Добрый день, ${currentUser.data.displayName}!`}
        description="Здесь собраны ученики и быстрые действия для ежедневной работы."
      />

      <TeacherDashboardContent
        data={dashboard.data}
        isPending={dashboard.isPending}
        isError={dashboard.isError}
        onRetry={() => {
          void dashboard.refetch();
        }}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <TeacherStudentsOverview
          data={students.data}
          isPending={students.isPending}
          isError={students.isError}
          onRetry={() => {
            void students.refetch();
          }}
        />

        <TeacherQuickActions />
      </div>
    </main>
  );
}

type DashboardContentProps = {
  data?: TeacherDashboard;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

function TeacherDashboardContent({ data, isPending, isError, onRetry }: Readonly<DashboardContentProps>) {
  if (isPending) {
    return <LoadingState>Загружаем сводку…</LoadingState>;
  }

  if (isError || !data) {
    return <ErrorState title="Не удалось загрузить сводку" onRetry={onRetry} retryLabel="Повторить загрузку сводки" />;
  }

  return (
    <div className="space-y-4">
      <TeacherDashboardStats data={data} />
      <TeacherAttention items={data.attentionItems} />
    </div>
  );
}

function TeacherHomeLoading() {
  return (
    <main>
      <LoadingState>Загружаем рабочее пространство…</LoadingState>
    </main>
  );
}
function TeacherHomeError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <main className="page-stack">
      <h1 className="page-title">Рабочее пространство</h1>
      <ErrorState title="Не удалось загрузить профиль преподавателя" onRetry={onRetry} />
    </main>
  );
}
