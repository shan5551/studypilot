import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = useCallback({
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg),
    info: (msg) => push('info', msg)
  }, [push]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 rounded-lg bg-white border border-slate-200 shadow-lg px-4 py-3 max-w-sm animate-slide-in-right dark:bg-slate-800 dark:border-slate-700"
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-brand-500 shrink-0" />}
            <p className="text-sm text-slate-800 dark:text-slate-100 flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};