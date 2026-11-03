import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const primary = "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover";
const outline = "border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground";
const destructive = "bg-destructive text-destructive-foreground shadow-xs hover:bg-danger-hover";
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: primary,
        primary,
        outline,
        secondary: outline,
        ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        danger: destructive,
        destructive,
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-(--control-height) px-4 py-2",
        sm: "min-h-9 px-3 py-1.5",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean; asChild?: boolean };
export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cn(buttonVariants({ variant }), className);
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "default", loading = false, asChild = false, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
      aria-busy={loading || props["aria-busy"]}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  );
});
