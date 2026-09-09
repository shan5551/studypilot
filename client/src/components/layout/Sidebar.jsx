import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, CheckSquare, Calendar, StickyNote,
  Sparkles, GraduationCap, Timer, BarChart3, Search, Settings, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/quizzes', label: 'Quiz Center', icon: GraduationCap },
  { to: '/sessions', label: 'Study Sessions', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const bottom = [
  { to: '/search', label: 'Search', icon: Search },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-full lg:h-screen w-64 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <BookOpen className="h-4.5 w-4.5 h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              StudyPilot
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
          {bottom.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-xs font-semibold">
                {initials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}