import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionVariant = 'secondary' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">{description}</p>}
      {actionLabel && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}