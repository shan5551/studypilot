import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { analyticsApi } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { Spinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatCard } from '../../components/ui/StatCard';
import {
  Clock, CheckSquare, GraduationCap, BarChart3, Flame, CalendarDays,
  Star, AlertTriangle
} from 'lucide-react';
import { formatMinutes } from '../../utils/format';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const tooltipStyle = {
  background: 'var(--tw-bg-opacity, #fff)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
};

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useFetch(() => analyticsApi.all());
  const a = data?.analytics;

  if (loading) return <Spinner size="lg" />;
  if (error) return <EmptyState icon={BarChart3} title="Couldn't load analytics" description={error} actionLabel="Retry" onAction={refetch} />;

  const { studyTime, tasks, quiz, subjects, streaks, activity } = a;

  const weeklySubjectData = subjects.map((s) => ({
    name: s.name,
    hours: Math.round(s.studyMinutes / 6) / 10,
    progress: s.progress
  }));

  const taskData = [
    { name: 'Completed', value: tasks.completed },
    { name: 'Pending', value: tasks.pending },
    { name: 'Overdue', value: tasks.overdue }
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Your study patterns, performance, and progress — at a glance.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Study time · month" value={formatMinutes(studyTime.monthMinutes)} color="indigo" />
        <StatCard icon={CheckSquare} label="Tasks completed" value={tasks.completed} sub={`${tasks.total} total · ${tasks.overdue} overdue`} color="green" />
        <StatCard icon={GraduationCap} label="Quiz accuracy" value={`${quiz.avgScore}%`} sub={`${quiz.attempts} attempts`} color="purple" />
        <StatCard icon={Flame} label="Streak" value={`${streaks.currentStreak}d`} sub={`longest ${streaks.longestStreak}d`} color="red" />
      </div>

      {/* Study time charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Daily study time · last 30 days</h2>
            <span className="text-xs text-slate-400">{formatMinutes(studyTime.totalMinutes)} total</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={studyTime.dailyStudy}>
                <defs>
                  <linearGradient id="studyd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" minTickGap={30} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} min`, 'Study time']} />
                <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} fill="url(#studyd)" name="minutes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Weekly study time · last 8 weeks</h2>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTime.weeklyStudy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}h`, 'Study time']} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Task & quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Task status</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={3}>
                  {taskData.map((_, i) => <Cell key={i} fill={[COLORS[4], COLORS[0], '#ef4444'][i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Quiz accuracy · recent attempts</h2>
          <div className="h-48">
            {quiz.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quiz.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 h-full flex items-center justify-center">No quiz attempts yet</p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
              <p className="flex items-center gap-1 text-slate-400"><Star className="h-3 w-3" /> Best subject</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{quiz.bestSubject?.name || '—'}</p>
              <p className="text-slate-400">{quiz.bestSubject?.avg ? `${quiz.bestSubject.avg}%` : 'no data'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
              <p className="flex items-center gap-1 text-slate-400"><AlertTriangle className="h-3 w-3" /> Weakest</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{quiz.weakestSubject?.name || '—'}</p>
              <p className="text-slate-400">{quiz.weakestSubject?.avg ? `${quiz.weakestSubject.avg}%` : 'no data'}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4">Tasks by priority</h2>
          <div className="space-y-3">
            {tasks.byPriority.map((p) => {
              const total = tasks.byPriority.reduce((s, x) => s + x.count, 0);
              const pct = total ? (p.count / total) * 100 : 0;
              const colors = { urgent: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8' };
              return (
                <div key={p.priority}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="capitalize text-slate-600 dark:text-slate-300">{p.priority}</span>
                    <span className="text-slate-400">{p.count}</span>
                  </div>
                  <div className="h-6 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    {/* placeholder segments done via width on inner */}
                    <div className="h-full rounded-l" style={{ width: `${pct}%`, backgroundColor: colors[p.priority] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Subject progress</h2>
          <span className="text-xs text-slate-400">study hours vs completion</span>
        </div>
        {weeklySubjectData.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Create subjects and add tasks to see progress here</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySubjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="hours" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="progress" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="hours" dataKey="hours" name="Study hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="progress" dataKey="progress" name="Completion %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Activity heatmap */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Study activity · last 16 weeks</h2>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            Less
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: ['#f1f5f9', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'][i] }} />
            ))}
            More
          </div>
        </div>
        {activity?.length ? (
          <ActivityHeatmap weeks={activity} />
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">Start studying to fill in your activity map</p>
        )}
      </div>
    </div>
  );
}

function ActivityHeatmap({ weeks }) {
  const max = Math.max(1, ...weeks.flat().map((d) => d.hours));
  const dayLabels = ['Mon', 'Wed', 'Fri', 'Sun'];
  return (
    <div className="flex gap-1 overflow-x-auto">
      <div className="flex flex-col gap-1 pr-1 text-[10px] text-slate-400">
        <span className="h-3" />
        {dayLabels.map((d) => <span key={d} className="h-3 leading-3">{d}</span>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((cell, ci) => {
            const opacity = cell.hours > 0 ? Math.min(1, 0.25 + (cell.hours / max) * 0.75) : 0.1;
            const date = new Date(cell.date);
            const isFuture = date > new Date();
            return (
              <div
                key={ci}
                className="h-3 w-3 rounded-[3px]"
                style={{
                  backgroundColor: isFuture ? 'transparent' : cell.hours > 0 ? `rgba(99, 102, 241, ${opacity})` : '#f1f5f9',
                }}
                title={cell.hours > 0 ? `${cell.date}: ${cell.hours}h` : cell.date}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}