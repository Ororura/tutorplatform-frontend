import Link from "next/link";
import { AuthShell } from "@/shared/ui/auth-shell";
import { buttonClassName } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function NotFound() {
  return (
    <AuthShell>
      <PageHeader title="Страница не найдена" description="Проверьте адрес или вернитесь на главную страницу." />
      <Link href="/" className={buttonClassName("primary", "mt-6")}>
        На главную
      </Link>
    </AuthShell>
  );
}
