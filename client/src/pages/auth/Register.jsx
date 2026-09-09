import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const passwordChecks = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Za-z]/.test(v), label: 'Contains a letter' },
  { test: (v) => /\d/.test(v), label: 'Contains a number' }
];

export default function Register() {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const password = watch('password', '');

  const onSubmit = async ({ name, email, password }) => {
    setLoading(true);
    try {
      await registerUser(name, email, password);
      toast.success('Account created — welcome to StudyPilot!');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.message || 'Registration failed');
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

      <div className="flex-1 flex items-center justify-center p-4 pb-12">
        <div className="card w-full max-w-sm p-8">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Start organizing your studies in under a minute.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input
              label="Name"
              placeholder="Your name"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
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
              Create account
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}