export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex justify-center items-center p-8" role="status" aria-label="Loading">
      <div className={`${sizes[size]} rounded-full border-2 border-slate-200 border-t-brand-500 animate-spin dark:border-slate-700 dark:border-t-brand-400`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}