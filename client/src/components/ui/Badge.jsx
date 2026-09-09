export function Badge({ children, color = 'slate', className = '' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
  };
  return <span className={`badge ${colors[color] || colors.slate} ${className}`}>{children}</span>;
}

export const priorityBadge = (priority) => {
  const map = {
    low: { color: 'slate', label: 'Low' },
    medium: { color: 'blue', label: 'Medium' },
    high: { color: 'amber', label: 'High' },
    urgent: { color: 'red', label: 'Urgent' }
  };
  return map[priority] || map.medium;
};

export const statusBadge = (status) => {
  const map = {
    todo: { color: 'slate', label: 'To do' },
    'in-progress': { color: 'blue', label: 'In progress' },
    completed: { color: 'green', label: 'Completed' }
  };
  return map[status] || map.todo;
};