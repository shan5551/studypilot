export function ProgressBar({ value, className = '', color }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color || undefined }}
      />
    </div>
  );
}