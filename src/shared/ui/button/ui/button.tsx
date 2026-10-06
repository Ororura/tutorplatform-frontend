import { type ButtonHTMLAttributes, forwardRef } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean };
const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover disabled:bg-primary-subtle disabled:text-primary",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-subtle active:bg-surface-hover disabled:border-border disabled:bg-surface-subtle disabled:text-foreground-muted",
  ghost:
    "bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground active:bg-surface-hover disabled:text-foreground-muted",
  danger:
    "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-hover disabled:bg-danger-subtle disabled:text-danger",
};
export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-(--control-height) items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none",
    variantClassNames[variant],
    className,
  );
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassName(variant, className)}
      disabled={disabled || loading}
      {...props}
      aria-busy={loading || props["aria-busy"]}
    >
      {loading && <LoaderCircle size={16} className="shrink-0 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
