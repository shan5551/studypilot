import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Check, KeyRound } from 'lucide-react';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const passwordChecks = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Za-z]/.test(v), label: 'Contains a letter' },
  { test: (v) => /\d/.test(v), label: 'Contains a number' }
];

export default function ResetPassword() {
  const { token } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const password = watch('password', '');

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated!');
      setDone(true);
    } catch (e) {
      toast.error(e.message || 'Could not reset the password');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="card w-full max-w-sm p-8">
          {done ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <KeyRound className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100 text-center">Password updated</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
                You can now log in with your new password.
              </p>
              <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
                Go to login
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set a new password</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <Input
                  label="New password"
                  type="password"
                  placeholder="Enter a new password"
                  {...register('password', { required: 'Password is required' })}
                  error={errors.password?.message}
                />
                <div className="space-y-1.5">
                  {passwordChecks.map((c) => (
                    <div key={c.label} className={`flex items-center gap-2 text-xs ${c.test(password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${c.test(password) ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        {c.test(password) && <Check className="h-3 w-3" />}
                      </span>
                      {c.label}
                    </div>
                  ))}
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}