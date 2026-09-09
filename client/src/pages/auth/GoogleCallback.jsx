import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { BookOpen } from 'lucide-react';

// Landing page reached after the Google OAuth redirect.
// Reads ?token= or ?error= from the URL and finalizes the login.
export default function GoogleCallback() {
  const [params] = useSearchParams();
  const { googleSignIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      googleSignIn(token)
        .then(() => {
          toast.success('Signed in with Google!');
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          toast.error('Google sign-in failed');
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">StudyPilot</span>
      </div>
      <PageLoader />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Completing sign-in…</p>
    </div>
  );
}
