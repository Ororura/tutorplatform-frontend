import type { LessonMaterial } from "../api/material-queries";
import { MaterialRenderer } from "./material-renderer";

export function MaterialList({ materials }: Readonly<{ materials: LessonMaterial[] }>) {
  if (materials.length === 0) {
    return <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-neutral-600">Для этой темы пока нет материалов.</p>;
  }

  return (
    <ol className="space-y-4">
      {materials.map((material) => (
        <li className="rounded-lg border border-neutral-200 bg-white p-5" key={material.id}>
          <h3 className="mb-3 font-semibold">{material.title}</h3>
          <MaterialRenderer material={material} />
        </li>
      ))}
    </ol>
  );
}
