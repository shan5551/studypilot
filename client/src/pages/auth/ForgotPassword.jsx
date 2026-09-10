import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, MailCheck } from 'lucide-react';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function ForgotPassword() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (e) {
      toast.error(e.message || 'Something went wrong');
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
          {sent ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <MailCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100 text-center">Check your inbox</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
                If an account exists for that email, we've sent a password reset link. It expires in 30 minutes.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link to="/login" className="text-center text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Forgot your password?</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
                  error={errors.email?.message}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Send reset link
                </Button>
              </form>

              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                Remembered it?{' '}
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}