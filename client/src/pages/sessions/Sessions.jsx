import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionApi, subjectApi } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Timer, Play, Pause, Square, RotateCcw, Clock, BookOpen, Flame,
  Target, TrendingUp
} from 'lucide-react';
import { formatDate, formatDuration, formatMinutes } from '../../utils/format';

export default function Sessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const pomodoro = user?.pomodoro || { studyMinutes: 25, breakMinutes: 5 };

  const [active, setActive] = useState(null); // active session from server
  const [elapsed, setElapsed] = useState(0); // seconds
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [subject, setSubject] = useState('');
  const [mode, setMode] = useState('manual'); // manual | pomodoro
  const [pomoPhase, setPomoPhase] = useState('study'); // study | break
  const [pomoRemaining, setPomoRemaining] = useState(pomodoro.studyMinutes * 60);
  const [pomoCount, setPomoCount] = useState(0);
  const [pomoRunning, setPomoRunning] = useState(false);

  const { data: subjectsData } = useFetch(() => subjectApi.list());
  const subjects = subjectsData?.subjects || [];

  const { data: sessionsData, loading, error, refetch } = useFetch(() => sessionApi.list());
  const sessions = sessionsData?.sessions || [];

  const tickRef = useRef(null);
  const intervalRef = useRef(null);

  // Manual timer tick
  useEffect(() => {
    if (running && startedAt) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running, startedAt]);

  // Check for an active session on mount
  useEffect(() => {
    sessionApi.list().then((res) => {
      const activeSession = (res.data.sessions || []).find((s) => !s.endedAt);
      if (activeSession) {
        setActive(activeSession);
        setSubject(activeSession.subject?._id || '');
        setStartedAt(new Date(activeSession.startedAt).getTime());
        setRunning(true);
        setElapsed(Math.floor((Date.now() - new Date(activeSession.startedAt)) / 1000));
      }
    }).catch(() => {});
  }, []);

  const startSession = async () => {
    try {
      const res = await sessionApi.start({ subject: subject || null, mode });
      setActive(res.data.session);
      setStartedAt(new Date(res.data.session.startedAt).getTime());
      setRunning(true);
      setElapsed(0);
      toast.success('Session started — happy studying!');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const pauseSession = () => {
    // Simple pause: we keep the accumulator by storing remaining elapsed locally
    setPausedElapsed(elapsed);
    setRunning(false);
    clearInterval(intervalRef.current);
    setWasPaused(true);
  };

  const [pausedElapsed, setPausedElapsed] = useState(0);
  const [wasPaused, setWasPaused] = useState(false);

  const resumeSession = () => {
    if (wasPaused) {
      // Rebase: recompute startedAt so elapsed continues from paused value
      const newStart = Date.now() - pausedElapsed * 1000;
      setStartedAt(newStart);
      setWasPaused(false);
    }
    setRunning(true);
  };

  const stopSession = async () => {
    if (!active) return;
    // If paused, rebase before ending so durationIncludes paused time is correct
    let endRes;
    try {
      endRes = await sessionApi.end(active._id);
      toast.success(`Session saved — ${formatDuration(endRes.data.session.durationMinutes)} studied`);
      setActive(null);
      setRunning(false);
      setElapsed(0);
      setWasPaused(false);
      setPausedElapsed(0);
      refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const formatClock = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const pomoCountRef = useRef(0);
  const pomoPhaseRef = useRef('study');

  // Keep refs in sync so the tick callback sees fresh values
  useEffect(() => { pomoCountRef.current = pomoCount; }, [pomoCount]);
  useEffect(() => { pomoPhaseRef.current = pomoPhase; }, [pomoPhase]);

  const handlePomoComplete = useCallback(() => {
    const phase = pomoPhaseRef.current;
    if (phase === 'study') {
      // Log a session
      sessionApi.start({ subject: subject || null, mode: 'pomodoro' }).then(() => refetch()).catch(() => {});
      const newCount = pomoCountRef.current + 1;
      pomoCountRef.current = newCount;
      setPomoCount(newCount);
      setPomoPhase('break');
      setPomoRemaining(pomodoro.breakMinutes * 60);
      setPomoRunning(true);
      toast.success('Focus session complete — take a break!');
    } else {
      setPomoPhase('study');
      setPomoRemaining(pomodoro.studyMinutes * 60);
      setPomoRunning(false);
      toast.info('Break over — ready for the next round');
    }
  }, [subject, pomodoro, toast]);

  // Pomodoro tick — decrement, and when it hits zero switch phase
  const pomoIntervalRef = useRef(null);
  useEffect(() => {
    if (pomoRunning && pomoRemaining > 0) {
      pomoIntervalRef.current = setInterval(() => {
        setPomoRemaining((r) => r - 1);
      }, 1000);
      return () => clearInterval(pomoIntervalRef.current);
    }
  }, [pomoRunning, pomoPhase]);

  // When remaining reaches 0 while running, complete the phase
  useEffect(() => {
    if (pomoRunning && pomoRemaining <= 0) {
      handlePomoComplete();
    }
  }, [pomoRemaining, pomoRunning, handlePomoComplete]);

  const resetPomodoro = () => {
    setPomoRunning(false);
    setPomoPhase('study');
    setPomoRemaining(pomodoro.studyMinutes * 60);
    pomoCountRef.current = 0;
    setPomoCount(0);
  };

  // Aggregate totals
  const totalMinutes = sessions.reduce((s, x) => s + (x.durationMinutes || 0), 0);
  const todayMinutes = sessions
    .filter((x) => new Date(x.startedAt).toDateString() === new Date().toDateString())
    .reduce((s, x) => s + (x.durationMinutes || 0), 0);

  const sessionsBySubject = {};
  sessions.forEach((x) => {
    const k = x.subject?.name || 'General';
    sessionsBySubject[k] = (sessionsBySubject[k] || 0) + (x.durationMinutes || 0);
  });
  const topSubjects = Object.entries(sessionsBySubject).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Study Sessions</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Track your focus time and build a consistent routine.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard icon={Timer} label="Today" value={formatMinutes(todayMinutes)} />
        <SummaryCard icon={TrendingUp} label="All time" value={formatMinutes(totalMinutes)} />
        <SummaryCard icon={Flame} label="Sessions" value={sessions.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual tracker */}
        <div className="card p-6 flex flex-col items-center">
          <h2 className="text-sm font-semibold self-start mb-4">Focus timer</h2>
          <div className="text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatClock(elapsed)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {running ? 'Focusing…' : wasPaused ? 'Paused' : active ? 'Stopped' : 'Ready'}
          </p>

          <div className="mt-6 w-full max-w-xs">
            <Select label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">General study</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {!active ? (
              <Button size="lg" onClick={startSession}>
                <Play className="h-4 w-4" /> Start
              </Button>
            ) : running ? (
              <Button size="lg" variant="secondary" onClick={pauseSession}>
                <Pause className="h-4 w-4" /> Pause
              </Button>
            ) : (
              <Button size="lg" onClick={resumeSession}>
                <Play className="h-4 w-4" /> Resume
              </Button>
            )}
            {active && (
              <Button size="lg" variant="danger" onClick={stopSession}>
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
          </div>
        </div>

        {/* Pomodoro */}
        <div className="card p-6 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-sm font-semibold">Pomodoro</h2>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Target className="h-3.5 w-3.5" /> {pomoCount} completed
            </span>
          </div>

          <div className={`text-6xl font-bold tracking-tight tabular-nums ${pomoPhase === 'break' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {pomoPhase === 'study' ? formatClock(pomoRemaining) : formatClock(pomoRemaining)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {pomoPhase === 'study' ? `${pomodoro.studyMinutes} min focus · ${pomodoro.breakMinutes} min break` : `${pomodoro.breakMinutes} min break`}
            {mode !== 'pomodoro' && ''}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {!pomoRunning ? (
              <Button size="lg" onClick={() => { setPomoRunning(true); setMode('pomodoro'); }}>
                <Play className="h-4 w-4" /> {pomoRemaining < pomodoro.studyMinutes * 60 ? 'Resume' : 'Start focus'}
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={() => setPomoRunning(false)}>
                <Pause className="h-4 w-4" /> Pause
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={resetPomodoro}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="mt-6 w-full flex items-center justify-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full ${i < pomoCount ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">4 focus sessions = long break</p>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Session history</h2>
        {loading ? (
          <Spinner />
        ) : error ? (
          <EmptyState icon={Clock} title="Couldn't load sessions" description={error} />
        ) : sessions.length === 0 ? (
          <EmptyState icon={Clock} title="No sessions yet" description="Start your first session above — even 15 focused minutes count." actionLabel="Start a session" onAction={startSession} />
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((s) => (
              <div key={s._id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {s.subject?.name || 'General study'}
                    {s.task && <span className="text-xs text-slate-400 font-normal"> · {s.task.title}</span>}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(s.startedAt)} · {s.mode === 'pomodoro' ? 'Pomodoro' : 'Manual'}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatMinutes(s.durationMinutes)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}