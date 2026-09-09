import { useState, useEffect } from 'react';

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3.5 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            active === t.key
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          role="tab"
          aria-selected={active === t.key}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabContent({ children }) {
  return <div className="pt-5">{children}</div>;
}