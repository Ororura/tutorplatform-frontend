import type { ReactNode } from "react";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/feedback";

import type { LessonMaterial } from "../api/material-queries";
import { MaterialRenderer } from "./material-renderer";

export function MaterialList({
  materials,
  renderActions,
}: Readonly<{ materials: LessonMaterial[]; renderActions?: (material: LessonMaterial, index: number) => ReactNode }>) {
  if (materials.length === 0) {
    return (
      <EmptyState
        title="Для этой темы пока нет материалов."
        description="Материалы появятся здесь после добавления преподавателем."
      />
    );
  }

  return (
    <ol className="space-y-4">
      {materials.map((material, index) => (
        <li className="min-w-0" key={material.id}>
          <Card className="p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <h3 className="min-w-0 wrap-break-word font-semibold">{material.title}</h3>
              {renderActions?.(material, index)}
            </div>
            <MaterialRenderer material={material} />
          </Card>
        </li>
      ))}
    </ol>
  );
}
