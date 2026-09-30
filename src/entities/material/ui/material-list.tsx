import type { ReactNode } from "react";

import type { LessonMaterial } from "../api/material-queries";
import { MaterialRenderer } from "./material-renderer";

export function MaterialList({
  materials,
  renderActions,
}: Readonly<{ materials: LessonMaterial[]; renderActions?: (material: LessonMaterial, index: number) => ReactNode }>) {
  if (materials.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-neutral-600">
        Для этой темы пока нет материалов.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {materials.map((material, index) => (
        <li className="min-w-0 rounded-md border border-slate-200 bg-white p-4 sm:p-5" key={material.id}>
          <div className="mb-3 flex items-start justify-between gap-4">
            <h3 className="min-w-0 wrap-break-word font-semibold">{material.title}</h3>
            {renderActions?.(material, index)}
          </div>
          <MaterialRenderer material={material} />
        </li>
      ))}
    </ol>
  );
}
