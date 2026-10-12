"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { dashboardQueries, type AttentionType } from "@/entities/dashboard";
import { TeacherAttention } from "./teacher-attention";

export function TeacherWorkQueue() {
  const [params, setParams] = useState<{ type?: AttentionType; page: number; size: number }>({ page: 0, size: 20 });
  const queue = useQuery(dashboardQueries.attention(params));
  return (
    <TeacherAttention
      items={queue.data?.items ?? []}
      filter={params.type}
      onFilterChange={(type) => setParams({ ...params, type, page: 0 })}
      isPending={queue.isPending}
      isError={queue.isError}
      onRetry={() => void queue.refetch()}
      page={params.page}
      totalPages={queue.data?.totalPages}
      totalElements={queue.data?.totalElements}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
}
