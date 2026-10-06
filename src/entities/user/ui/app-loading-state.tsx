export function AppLoadingState({ label = "Проверяем сессию…" }: Readonly<{ label?: string }>) {
  return (
    <main className="page-stack grid min-h-screen place-items-center" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-foreground-muted">
        <span
          className="size-4 motion-safe:animate-spin rounded-full border-2 border-border-strong border-t-foreground-muted"
          aria-hidden="true"
        />
        {label}
      </div>
    </main>
  );
}
