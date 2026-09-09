import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Compass className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}