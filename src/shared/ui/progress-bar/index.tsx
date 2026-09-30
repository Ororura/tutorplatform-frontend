export function ProgressBar({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 overflow-hidden rounded-full bg-slate-100"
    >
      <div className="h-full rounded-full bg-blue-500" style={{ width: `${value}%` }} />
    </div>
  );
}
