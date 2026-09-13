export function AppLoadingState({ label = "Проверяем сессию…" }: Readonly<{ label?: string }>) {
  return (
    <main className="grid min-h-screen place-items-center px-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-neutral-600">
        <span
          className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800"
          aria-hidden="true"
        />
        {label}
      </div>
    </main>
  );
}
