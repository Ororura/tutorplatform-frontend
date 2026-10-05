import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
export function Surface({ inset = false, className, ...props }: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return <div className={cn(inset ? "surface-inset" : "surface", className)} {...props} />;
}
