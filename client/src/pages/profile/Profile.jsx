import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useFetch } from '../../hooks/useFetch';
import { analyticsApi } from '../../services/api';
import { StickyNote, CheckSquare, Clock, GraduationCap, Mail, CalendarDays, Sparkles } from 'lucide-react';
import { formatDate, initials } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: statsData } = useFetch(() => analyticsApi.dashboard());
  const stats = statsData?.stats;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await userApi.updateProfile({ name, email });
      updateUser(res.data.user);
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await userApi.deleteAccount();
      logout();
      toast.info('Account deleted');
      navigate('/');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Your account details and study summary.</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-xl font-bold">
            {initials(user?.name)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <CalendarDays className="h-3 w-3" /> Member since {formatDate(user?.createdAt)}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit profile</Button>
        </div>
      </div>

      {/* Study summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={CheckSquare} label="Tasks done" value={stats?.completedTasks ?? 0} />
        <MiniStat icon={Clock} label="Study hours" value={Math.round((stats?.totalMinutes ?? 0) / 6) / 10} />
        <MiniStat icon={StickyNote} label="Notes" value={stats?.notesCount ?? 0} />
        <MiniStat icon={GraduationCap} label="Quiz avg" value={stats?.quizAvg ? `${stats.quizAvg}%` : '—'} />
      </div>

      {/* AI preferences hint */}
      <div className="rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/30 p-5 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">AI study insights</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            StudyPilot analyzes your tasks, quiz results, and study time to recommend what to focus next. Open your dashboard or the AI Assistant to see suggestions.
          </p>
        </div>
      </div>

      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete account</p>
          <p className="text-xs text-slate-400 mt-0.5">Permanently removes all your data.</p>
        </div>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete account</Button>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveProfile} loading={saving}>Save changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAccount}
        title="Delete your account?"
        message="This will permanently delete your account, notes, tasks, and all study data. This cannot be undone."
        confirmLabel="Delete everything"
      />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="card p-4">
      <Icon className="h-4 w-4 text-slate-400 mb-2" />
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}