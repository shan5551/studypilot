// Simple StatCard
export function StatCard({ icon: Icon, label, value, sub, color = 'indigo', onClick }) {
  const colors = {
    indigo: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950',
    green: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
    amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
    red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
    purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950',
    slate: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
  };
  return (
    <div
      onClick={onClick}
      className={`card p-4 ${onClick ? 'cursor-pointer hover:shadow-cardHover transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[color] || colors.indigo}`}>
            <Icon className="h-4.5 w-4.5 h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}