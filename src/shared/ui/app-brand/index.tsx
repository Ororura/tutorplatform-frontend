import { BookOpen } from "lucide-react";
import Link from "next/link";
export function AppBrand({
  href,
  subtitle,
  label = "Умнее Вместе — главная",
}: Readonly<{ href: string; subtitle: string; label?: string }>) {
  return (
    <Link href={href} aria-label={label} className="flex shrink-0 items-center gap-2.5 rounded-control">
      <span className="flex size-9 items-center justify-center rounded-inset bg-primary text-primary-foreground">
        <BookOpen size={20} aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-foreground">Умнее Вместе</span>
        <span className="mt-0.5 hidden text-xs sm:block text-foreground-muted">{subtitle}</span>
      </span>
    </Link>
  );
}
