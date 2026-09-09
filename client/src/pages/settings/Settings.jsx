import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Moon, Sun, Bell, Brain, KeyRound, Timer } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [saving, setSaving] = useState(null);

  const notify = user?.settings?.notifications || {};
  const ai = user?.settings?.ai || {};
  const pomodoro = user?.pomodoro || { studyMinutes: 25, breakMinutes: 5 };

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const saveSettings = async (patch, label) => {
    setSaving(label);
    try {
      const res = await userApi.updateSettings(patch);
      updateUser(res.data.user);
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const changeTheme = (t) => {
    setTheme(t);
    saveSettings({ settings: { theme: t } }, 'theme');
  };

  const toggleNotification = (key) => {
    saveSettings({ settings: { notifications: { ...notify, [key]: !notify[key] } } }, key);
  };

  const changePassword = async () => {
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await userApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Personalize your StudyPilot experience.</p>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          {theme === 'dark' ? <Moon className="h-4 w-4 text-slate-400" /> : <Sun className="h-4 w-4 text-slate-400" />}
          <h2 className="text-sm font-semibold">Appearance</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => changeTheme('light')}
            className={`rounded-lg border p-3 text-sm font-medium transition-colors ${theme === 'light' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <Sun className="h-4 w-4 mb-1.5" /> Light
          </button>
          <button
            onClick={() => changeTheme('dark')}
            className={`rounded-lg border p-3 text-sm font-medium transition-colors ${theme === 'dark' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <Moon className="h-4 w-4 mb-1.5" /> Dark
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { key: 'deadlineReminders', label: 'Task deadline reminders', desc: 'Notify me when a task deadline is approaching' },
            { key: 'overdueAlerts', label: 'Overdue alerts', desc: 'Notify me when a task becomes overdue' },
            { key: 'quizCompleted', label: 'Quiz results', desc: 'Show a summary after completing a quiz' },
            { key: 'streakMilestones', label: 'Streak milestones', desc: 'Celebrate when your study streak grows' }
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.label}</p>
                <p className="text-xs text-slate-400">{n.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={Boolean(notify[n.key])}
                onClick={() => toggleNotification(n.key)}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${notify[n.key] ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notify[n.key] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI preferences */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">AI preferences</h2>
        </div>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="label">Default summary length</label>
            <select
              className="input"
              value={ai.summaryLength || 'medium'}
              onChange={(e) => saveSettings({ settings: { ai: { ...ai, summaryLength: e.target.value } } }, 'aiLen')}
            >
              <option value="short">Short — key points only</option>
              <option value="medium">Medium — balanced</option>
              <option value="detailed">Detailed — comprehensive</option>
            </select>
          </div>
          <div>
            <label className="label">Assistant personality (context prompt)</label>
            <textarea
              className="input min-h-[70px]"
              placeholder="e.g. I'm a visual learner who likes examples first."
              value={ai.defaultContext || ''}
              onChange={(e) => saveSettings({ settings: { ai: { ...ai, defaultContext: e.target.value } } }, 'aiCtx')}
            />
            <p className="text-xs text-slate-400 mt-1">This context is provided to the AI assistant with your questions.</p>
          </div>
        </div>
      </div>

      {/* Pomodoro */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Pomodoro timer</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div>
            <label className="label">Focus (min)</label>
            <input
              type="number"
              className="input"
              min="1"
              max="90"
              defaultValue={pomodoro.studyMinutes}
              onBlur={(e) => {
                const v = Math.max(1, Math.min(90, Number(e.target.value) || 25));
                saveSettings({ pomodoro: { ...pomodoro, studyMinutes: v } }, 'pomo');
              }}
            />
          </div>
          <div>
            <label className="label">Break (min)</label>
            <input
              type="number"
              className="input"
              min="1"
              max="30"
              defaultValue={pomodoro.breakMinutes}
              onBlur={(e) => {
                const v = Math.max(1, Math.min(30, Number(e.target.value) || 5));
                saveSettings({ pomodoro: { ...pomodoro, breakMinutes: v } }, 'pomo');
              }}
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Change password</h2>
        </div>
        <div className="space-y-3 max-w-md">
          <Input
            label="Current password"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
          <Button onClick={changePassword} loading={pwSaving}>Update password</Button>
        </div>
      </div>
    </div>
  );
}