"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpenText, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import {
  type LearningProgramStatus,
  learningProgramQueries,
  LearningProgramStatusBadge,
} from "@/entities/learning-program";
import { ActivateLearningProgramButton } from "@/features/program/activate";
import { CreateLearningProgramDialog } from "@/features/program/create";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/form-controls";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/feedback";

const filters = [
  { value: "", label: "Все" },
  { value: "ACTIVE", label: "Активные" },
  { value: "DRAFT", label: "Черновики" },
  { value: "ARCHIVED", label: "Архив" },
] as const;

export function TeacherProgramsView() {
  const programs = useQuery(learningProgramQueries.list());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LearningProgramStatus | "">("");
  const visible = programs.data?.filter(
    (program) =>
      (!status || program.status === status) &&
      `${program.title} ${program.subject.name}`
        .toLocaleLowerCase("ru")
        .includes(search.trim().toLocaleLowerCase("ru")),
  );
  return (
    <main className="page-stack">
      <PageHeader
        title="Программы обучения"
        description="Постройте учебный маршрут: модули, темы, материалы и практика."
        actions={<CreateLearningProgramDialog />}
      />
      <Card>
        <CardHeader className="gap-4 border-b border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Ваши программы</CardTitle>
              <CardDescription className="mt-1">Черновик нужно активировать перед назначением ученику.</CardDescription>
            </div>
            {programs.isFetching && !programs.isPending && (
              <span role="status" className="text-xs text-muted-foreground">
                Обновляем…
              </span>
            )}
          </div>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div aria-label="Состояние программ" className="flex flex-wrap gap-1">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={filter.value === status ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={filter.value === status}
                  onClick={() => setStatus(filter.value)}
                >
                  {filter.label}
                  <span className="tabular-nums text-muted-foreground">
                    {programs.data
                      ? programs.data.filter((item) => !filter.value || item.status === filter.value).length
                      : "—"}
                  </span>
                </Button>
              ))}
            </div>
            <div className="relative min-w-0 lg:w-64">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Поиск программы"
                placeholder="Название или предмет"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {programs.isPending && <LoadingState>Загружаем программы…</LoadingState>}
          {programs.isError && (
            <ErrorState title="Не удалось загрузить программы." onRetry={() => void programs.refetch()} />
          )}
          {!programs.isError && visible?.length === 0 && (
            <EmptyState
              title={programs.data?.length ? "Программы не найдены" : "Программ пока нет"}
              description={
                programs.data?.length
                  ? "Измените поисковый запрос или выберите другой статус."
                  : "Создайте первую программу. После активации её можно будет назначить ученику."
              }
              action={
                search || status ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch("");
                      setStatus("");
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                ) : undefined
              }
            />
          )}
          {!programs.isError && visible && visible.length > 0 && (
            <div className="divide-y divide-border">
              {visible.map((program) => (
                <article
                  key={program.id}
                  className="relative grid gap-4 p-5 transition-colors hover:bg-accent sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <Link
                    href={`/teacher/programs/${program.slug}`}
                    aria-label={`Открыть программу: ${program.title}`}
                    className="absolute inset-0 rounded-md focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  />
                  <div className="pointer-events-none flex min-w-0 items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary">
                      <BookOpenText size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="wrap-break-word text-sm font-semibold">{program.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{program.subject.name}</p>
                      {program.description && (
                        <p className="mt-2 line-clamp-2 wrap-break-word text-sm text-muted-foreground">
                          {program.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-14 sm:justify-end sm:pl-0">
                    <LearningProgramStatusBadge status={program.status} />
                    {program.status === "DRAFT" && (
                      <div className="relative z-10">
                        <ActivateLearningProgramButton programId={program.id} triggerVariant="secondary" />
                      </div>
                    )}
                    <ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
