import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";
export function Surface({ inset = false, className, ...props }: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return inset ? (
    <div className={cn("surface-inset", className)} {...props} />
  ) : (
    <Card className={cn("p-(--surface-padding)", className)} {...props} />
  );
}
