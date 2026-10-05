import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";
export const badgeToneClassNames: Record<BadgeTone, string> = {
  neutral: "bg-surface-hover text-foreground-muted",
  info: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
};
export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("badge", badgeToneClassNames[tone], className)} {...props} />;
}
