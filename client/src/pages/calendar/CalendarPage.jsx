import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { Spinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus
} from 'lucide-react';
import { isOverdue } from '../../utils/format';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useFetch(() => taskApi.list());
  const tasks = data?.tasks || [];

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthTasks = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks, year, month]);

  // Build grid cells
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [year, month]);

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const today = new Date();

  const selectedTasks = selectedDate
    ? tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === selectedDate.toDateString())
    : [];

  const dateKey = (d) => d.toDateString();

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">See your deadlines and plan upcoming work.</p>
        </div>
        <Button onClick={() => navigate('/tasks?new=1')}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState icon={CalendarDays} title="Couldn't load calendar" description={error} actionLabel="Retry" onAction={refetch} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Month grid */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{MONTHS[month]} <span className="text-slate-400 font-normal">{year}</span></h2>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Today
                </button>
                <button onClick={nextMonth} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const inMonth = d.getMonth() === month;
                const isToday = d.toDateString() === today.toDateString();
                const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                const dayTasks = monthTasks[d.getDate()];
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={`rounded-lg p-1.5 min-h-[64px] text-left transition-colors border ${
                      inMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40 opacity-50'
                    } ${isSelected ? 'border-brand-500 ring-1 ring-brand-500' : 'border-transparent'} ${isToday ? 'bg-brand-50/60 dark:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                  >
                    <div className={`flex items-center justify-between px-0.5 mb-1`}>
                      <span className={`text-xs font-medium ${isToday ? 'text-brand-600 dark:text-brand-400 font-bold' : inMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                        {d.getDate()}
                      </span>
                      {(dayTasks?.length > 0) && (
                        <span className="text-[9px] text-slate-400">{dayTasks.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {(dayTasks || []).slice(0, 3).map((t) => {
                        const overdue = isOverdue(t.dueDate) && t.status !== 'completed';
                        return (
                          <div
                            key={t._id}
                            className={`truncate rounded px-1 py-0.5 text-[9px] leading-none ${t.status === 'completed' ? 'line-through text-slate-300 dark:text-slate-600' : overdue ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : t.subject?.color ? 'text-white' : 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'}`}
                            style={!overdue && t.status !== 'completed' && t.subject?.color ? { backgroundColor: t.subject.color } : {}}
                          >
                            {t.title}
                          </div>
                        );
                      })}
                      {(dayTasks?.length || 0) > 3 && <div className="text-[9px] text-slate-400 pl-1">+{(dayTasks.length - 3)} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-3">
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a day'}
              </h3>
              {!selectedDate ? (
                <p className="text-xs text-slate-400">Click any date to see its tasks.</p>
              ) : selectedTasks.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-400 mb-3">No tasks on this day</p>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/tasks?new=1&date=${selectedDate.toISOString().slice(0, 10)}`)}>
                    <Plus className="h-3.5 w-3.5" /> Add task
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTasks.map((t) => (
                    <div key={t._id} className={`rounded-lg border p-3 ${t.status === 'completed' ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40' : 'border-slate-100 dark:border-slate-800'}`}>
                      <p className={`text-sm font-medium ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{t.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.priority} priority
                        {t.subject ? ` · ${t.subject.name}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-500" /> Upcoming</h3>
              <UpcomingList tasks={tasks} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UpcomingList({ tasks }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) >= today)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  if (upcoming.length === 0) return <p className="text-slate-400 text-sm">Nothing upcoming</p>;

  return (
    <div className="space-y-2">
      {upcoming.map((t) => (
        <div key={t._id} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {new Date(t.dueDate).getDate()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
            <p className="text-xs text-slate-400">
              {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {t.subject ? ` · ${t.subject.name}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}