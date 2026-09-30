import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600 disabled:bg-blue-100 disabled:text-blue-800",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-blue-600",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-600",
};

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none",
    variantClassNames[variant],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref,
) {
  return <button ref={ref} className={buttonClassName(variant, className)} {...props} />;
});
