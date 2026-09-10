import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, MailCheck, MailX } from 'lucide-react';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui/Button';

// Handles the /verify-email/:token route. On mount, POSTs the token to the
// backend to activate the account, then shows the outcome.
export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing verification token.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        if (!cancelled) {
          setState('success');
          setMessage(res.data.message || 'Email verified!');
        }
      } catch (e) {
        if (!cancelled) {
          setState('error');
          setMessage(e.message || 'Verification failed');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-center pt-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">StudyPilot</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-8 text-center">
          {state === 'loading' && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Verifying your email…</h1>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <MailCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Email verified!</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
              <Button className="mt-6 w-full" onClick={() => (window.location.href = '/login')}>
                Continue to login
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                <MailX className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Verification failed</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link to="/register" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Create a new account
                </Link>
                <Link to="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}