"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardQueries, type TeacherDashboard } from "@/entities/dashboard";
import { studentQueries } from "@/entities/student";
import { useCurrentUserQuery } from "@/entities/user";
import { Button } from "@/shared/ui/button";
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
    <main className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <p className="text-sm font-medium text-blue-600">Рабочее пространство</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Добрый день, {currentUser.data.displayName}!
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Здесь собраны ученики и быстрые действия для ежедневной работы.
        </p>
      </section>

      <TeacherDashboardContent
        data={dashboard.data}
        isPending={dashboard.isPending}
        isError={dashboard.isError}
        onRetry={() => {
          void dashboard.refetch();
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <TeacherStudentsOverview
            data={students.data}
            isPending={students.isPending}
            isError={students.isError}
            onRetry={() => {
              void students.refetch();
            }}
          />
        </div>

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
    return (
      <section
        aria-busy="true"
        className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]"
      >
        Загружаем сводку…
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-6" role="alert">
        <h2 className="text-lg font-semibold text-slate-950">Не удалось загрузить сводку</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Проверьте соединение и попробуйте ещё раз.</p>
        <Button className="mt-4" type="button" variant="secondary" onClick={onRetry}>
          Повторить загрузку сводки
        </Button>
      </section>
    );
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
      <div
        className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]"
        aria-busy="true"
      >
        Загружаем рабочее пространство…
      </div>
    </main>
  );
}

function TeacherHomeError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <main>
      <div className="rounded-2xl border border-red-100 bg-white p-6" role="alert">
        <h1 className="text-xl font-semibold text-slate-950">Не удалось загрузить профиль преподавателя</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Проверьте соединение и попробуйте ещё раз.</p>
        <Button className="mt-5" type="button" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    </main>
  );
}
